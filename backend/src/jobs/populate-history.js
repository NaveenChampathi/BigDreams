const mongoose = require('mongoose');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const API_KEY = 'AKUZGQ4LP0JFTH8MLI8G';
const API_SECRET = 'SxyK42v8ziuSjtXiku9AEjKOLBT95C8xeu5GyzSb';
const { getCollection } = require('../models/historical-stock-data.model');
const StockSymbols = require('../models/stocks.model');

const toISOStringLocal = (d, yearsBack) => {
  const z = (n) => {
    return (n < 10 ? '0' : '') + n;
  };
  const year = yearsBack ? d.getFullYear() - yearsBack : d.getFullYear();
  return year + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
};

const alpaca = new Alpaca({
  keyId: API_KEY,
  secretKey: API_SECRET,
});

mongoose
  .connect('mongodb://127.0.0.1:27017/dreams', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    StockSymbols.find({}, async (err, results) => {
      // Find symbols that are not in db
      const db_results = results.map((r) => r.symbol);
      //   console.log(db_results);

      for await (let symbol of db_results) {
        const StockSymbolCollection = getCollection(symbol);
        const resp = alpaca.getBarsV2(
          symbol,
          {
            start: toISOStringLocal(new Date(), 3),
            end: toISOStringLocal(new Date()),
            timeframe: '1Day',
          },
          alpaca.configuration
        );

        const bars = [];

        for await (let b of resp) {
          bars.push({
            _id: mongoose.Types.ObjectId(),
            TimeStamp: b.Timestamp,
            HighPrice: b.HighPrice,
            OpenPrice: b.OpenPrice,
            LowPrice: b.LowPrice,
            ClosePrice: b.ClosePrice,
            Volume: b.Volume,
            VWAP: b.vw,
          });
        }

        console.log(symbol + ' Processing complete');

        await StockSymbolCollection.insertMany(bars)
          .then((value) => {
            console.log(symbol + ' Saved Successfully');
            //   mongoose.connection.close();
          })
          .catch((error) => {
            console.log(symbol + ' ' + error);
            //   mongoose.connection.close();
          });
      }
    });
  })
  .catch((err) => console.log(err));
