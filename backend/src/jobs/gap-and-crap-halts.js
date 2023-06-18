const mongoose = require('mongoose');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const moment = require('moment-timezone');
const HaltHistory = require('../models/halt-history.model');

const alpaca = new Alpaca();

const constructDate = (date) => {
  const dateParams = date.split('/');

  // return `${dateParams[2]}-${dateParams[0]}-${dateParams[1]}T04:00:00Z`;
  return `${dateParams[2]}-${dateParams[0]}-${dateParams[1]}`;
  // return date.split('T')[0];
};

const getIntradayStats = (_bars) => {
  let intradayHighAfterHalt = {
    HighPrice: 0,
  };
  let intradayLowAfterHalt = {
    LowPrice: 1000,
  };

  let intradayHighIndex = 0;

  _bars.forEach((b, i) => {
    if (b.HighPrice >= intradayHighAfterHalt.HighPrice) {
      intradayHighAfterHalt = b;
      intradayHighIndex = i;
    }
  });

  _bars.slice(intradayHighIndex).forEach((b) => {
    if (b.LowPrice <= intradayLowAfterHalt.LowPrice) {
      intradayLowAfterHalt = b;
    }
  });

  return {
    High: intradayHighAfterHalt,
    Low: intradayLowAfterHalt,
  };
};

const isHaltAndCrap = (_bars, preMarketVolume) => {
  const haltedBarsStats = [];
  const preMarketVolumeCheck = preMarketVolume < 100000;
  let isHaltAndCrapEligible = false;
  let haltedBarStat = {};

  const first10BarVolumeCheck = true || _bars.slice(0, 10).reduce((p, c) => p.Volume + c.Volume) < 500000;

  let volumeLeadingToHalt = 0;

  for (let i = 1; i < _bars.length; i++) {
    const barNow = _bars[i];
    const barPrevious = _bars[i - 1];

    if (barNow && barPrevious) {
      let duration = moment(barNow.Timestamp).diff(moment(barPrevious.Timestamp), 'minutes');
      volumeLeadingToHalt += barPrevious.Volume;

      if (duration >= 5) {
        haltedBarsStats.push({
          haltBarIndex: i - 1,
          avgVolumeLeadingToHalt: volumeLeadingToHalt / (i - 1),
          haltBarVolume: barPrevious.Volume,
          haltBarClosePrice: barPrevious.ClosePrice,
          haltBarOpenPrice: barPrevious.OpenPrice,
          haltBarHighPrice: barPrevious.HighPrice,
          haltBarLowPrice: barPrevious.LowPrice,
          haltOpenBarVolume: barNow.Volume,
          haltOpenBarClosePrice: barNow.ClosePrice,
          haltOpenBarOpenPrice: barNow.OpenPrice,
          haltOpenBarHighPrice: barNow.HighPrice,
          haltOpenBarLowPrice: barNow.LowPrice,
          upHalt: barPrevious.ClosePrice > barPrevious.OpenPrice,
        });
      }
    }
  }

  if (preMarketVolumeCheck && first10BarVolumeCheck) {
    for (let i = 0; i < haltedBarsStats.length; i++) {
      const { haltBarVolume, avgVolumeLeadingToHalt, haltOpenBarVolume } = haltedBarsStats[i];

      if (haltBarVolume > 3 * avgVolumeLeadingToHalt && haltOpenBarVolume > 30000) {
        isHaltAndCrapEligible = true;
        haltedBarStat = haltedBarsStats[i];
        break;
      }
    }
  }

  let intradayStats = {};
  debugger;
  if (Object.keys(haltedBarStat).length) {
    intradayStats = getIntradayStats(_bars.slice(haltedBarStat.haltBarIndex));
  }

  // console.log({
  //   isHaltAndCrapEligible,
  //   haltedBarStat,
  //   intradayHighAfterHalt: intradayStats.High,
  //   intradayLowAfterHalt: intradayStats.Low,
  // });

  return {
    isHaltAndCrapEligible,
    haltedBarStat,
    intradayHighAfterHalt: intradayStats.High,
    intradayLowAfterHalt: intradayStats.Low,
  };
};

mongoose
  .connect('mongodb://127.0.0.1:27017/dreams', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    const haltedTickers = await HaltHistory.find({ reasonCode: 'LUDP' }).exec();
    // const t = await HaltHistory.findOne({ reasonCode: 'LUDP', validHaltResumeEntry: true }).exec();
    // const haltedTickers = [t];
    // console.log(haltedTickers);

    for await (let ticker of haltedTickers) {
      // const StockSymbolCollection = getCollection(ticker.issueSymbol);
      // const match = await StockSymbolCollection.findOne({ TimeStamp: constructDate(ticker.haltDate) }).exec();

      // if (match) {
      //   try {
      //     await HaltHistory.updateOne({ _id: ticker.id }, { $set: { dayVolume: match.Volume } }, (e) => {
      //       if (e) {
      //         console.log('Update Error');
      //       }

      //       console.log('Updated');
      //     });
      //   } catch (e) {
      //     console.log('Error');
      //   }
      // } else {
      //   console.log('Symbol not found ' + ticker.issueSymbol);
      // }

      try {
        // Premarket
        const resp = alpaca.getBarsV2(
          ticker.issueSymbol,
          {
            start: `${constructDate(ticker.haltDate)}T04:00:00-04:00`,
            end: `${constructDate(ticker.haltDate)}T09:30:00-04:00`,
            timeframe: '1Min',
          },
          alpaca.configuration
        );

        const preMarketBars = [];
        for await (let b of resp) {
          b.Timestamp = moment.tz(b.Timestamp, 'America/New_York').format();
          preMarketBars.push(b);
        }

        //  Market Open
        const resp2 = alpaca.getBarsV2(
          ticker.issueSymbol,
          {
            start: `${constructDate(ticker.haltDate)}T09:31:00-04:00`,
            end: `${constructDate(ticker.haltDate)}T16:00:00-04:00`,
            timeframe: '1Min',
          },
          alpaca.configuration
        );

        const marketOpenBars = [];
        for await (let b of resp2) {
          b.Timestamp = moment.tz(b.Timestamp, 'America/New_York').format();
          marketOpenBars.push(b);
        }

        const preMarketVolume = preMarketBars.reduce((previous, current) => {
          return previous.Volume + current.Volume;
        });
        const { isHaltAndCrapEligible, haltedBarStat, intradayLowAfterHalt, intradayHighAfterHalt } = isHaltAndCrap(
          marketOpenBars,
          preMarketVolume
        );

        // console.log(isHaltAndCrapStatEligible);

        // return isHaltAndCrapStatEligible;

        // if (isHaltAndCrapStatEligible) {
        try {
          await HaltHistory.updateOne(
            { _id: ticker.id },
            {
              $set: {
                validHaltResumeEntry: isHaltAndCrapEligible,
                haltedBarStat,
                intradayLowAfterHalt,
                intradayHighAfterHalt,
              },
            },
            (e) => {
              if (e) {
                console.log('Update Error');
              }

              console.log('Updated ' + ticker.haltDate.split('T')[0]);
            }
          );
        } catch (e) {
          console.log('Error');
        }
        // }
      } catch (err) {
        console.log(err);
      }
    }

    console.log('Done');
    process.kill(process.pid);
  });
