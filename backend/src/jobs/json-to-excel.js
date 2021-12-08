const mongoose = require('mongoose');
const HaltHistory = require('../models/halt-history.model');
const json2xls = require('json2xls');
const fs = require('fs');

const { getStockData } = require('../services/finviz.service');

const jsonArray = [];

// Gap and crap stats excel conversion
mongoose
  .connect('mongodb://127.0.0.1:27017/dreams', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    // const t = await HaltHistory.findOne({ reasonCode: 'LUDP', validHaltResumeEntry: true }).exec();
    // const haltedTickers = [t];
    const haltedTickers = await HaltHistory.find({ reasonCode: 'LUDP' }).exec();
    for await (let ticker of haltedTickers) {
      const { haltedBarStat, intradayHighAfterHalt, intradayLowAfterHalt } = ticker;
      if (haltedBarStat && intradayHighAfterHalt && intradayLowAfterHalt) {
        let fundamentals = {};
        try {
          fundamentals = await getStockData(ticker.issueSymbol);
          await HaltHistory.updateOne(
            { _id: ticker.id },
            {
              $set: {
                float: fundamentals['Shs Float'],
                marketCap: fundamentals['Market Cap'],
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

        let tempArray = {
          Symbol: ticker.issueSymbol,
          Float: fundamentals['Shs Float'],
          'Market Cap': fundamentals['Market Cap'],
          'Halt Date': ticker.haltDate.split('T')[0],
          'Halt Time': ticker.haltTime,
          'Day Volume': ticker.dayVolume,
          'Average Volume Leading to Halt': ticker.haltedBarStat.get('avgVolumeLeadingToHalt'),
          'Halted Bar Volume': ticker.haltedBarStat.get('haltBarVolume'),
          'Halted Bar Open Price': ticker.haltedBarStat.get('haltBarOpenPrice'),
          'Halted Bar High Price': ticker.haltedBarStat.get('haltBarHighPrice'),
          'Halted Bar Low Price': ticker.haltedBarStat.get('haltBarLowPrice'),
          'Halted Bar Close Price': ticker.haltedBarStat.get('haltBarClosePrice'),
          'Halted Open Bar Volume': ticker.haltedBarStat.get('haltOpenBarVolume'),
          'Halted Open Bar Open Price': ticker.haltedBarStat.get('haltOpenBarOpenPrice'),
          'Halted Open Bar High Price': ticker.haltedBarStat.get('haltOpenBarHighPrice'),
          'Halted Open Bar Low Price': ticker.haltedBarStat.get('haltOpenBarLowPrice'),
          'Halted Open Bar Close Price': ticker.haltedBarStat.get('haltOpenBarClosePrice'),
          'High Price After Halt': ticker.intradayHighAfterHalt.get('HighPrice'),
          'Time of High after Halt': ticker.intradayHighAfterHalt.get('Timestamp')
            ? ticker.intradayHighAfterHalt.get('Timestamp').split('T')[1].split('-')[0]
            : '00:00:00',
          'High After Halt Volume': ticker.intradayHighAfterHalt.get('Volume'),
          'Low Price After Halt': ticker.intradayLowAfterHalt.get('LowPrice'),
          'Low After Halt Volume': ticker.intradayLowAfterHalt.get('Volume'),
          'Time of Low after Halt': ticker.intradayLowAfterHalt.get('Timestamp')
            ? ticker.intradayLowAfterHalt.get('Timestamp').split('T')[1].split('-')[0]
            : '00:00:00',
        };
        haltedBarStat.size && jsonArray.push(tempArray);
      }
    }

    var xls = json2xls(jsonArray);

    fs.writeFileSync('gapAndCrap.xlsx', xls, 'binary');
  });

// process.kill(process.pid);
