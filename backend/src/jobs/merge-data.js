const mongoose = require('mongoose');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const HaltHistory = require('../models/halt-history.model');
const { getCollection } = require('../models/historical-stock-data.model');

const alpaca = new Alpaca();

const constructDate = (date) => {
  const dateParams = date.split('/');

  // return `${dateParams[2]}-${dateParams[0]}-${dateParams[1]}T04:00:00Z`;
  return `${dateParams[2]}-${dateParams[0]}-${dateParams[1]}`;
};

mongoose
  .connect('mongodb://127.0.0.1:27017/dreams', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    const haltedTickers = await HaltHistory.find({ reasonCode: 'LUDP' }).exec();

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
        const resp = alpaca.getBarsV2(
          ticker.issueSymbol,
          {
            start: constructDate(ticker.haltDate),
            end: constructDate(ticker.haltDate),
            timeframe: '1Day',
          },
          alpaca.configuration
        );

        const bars = [];
        for await (let b of resp) {
          bars.push(b);
        }

        const [data] = bars;

        if (data) {
          try {
            await HaltHistory.updateOne({ _id: ticker.id }, { $set: { dayVolume: data.Volume } }, (e) => {
              if (e) {
                console.log('Update Error');
              }

              console.log('Updated');
            });
          } catch (e) {
            console.log('Error');
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  });

// console.log(constructDate('08/23/2021'));
