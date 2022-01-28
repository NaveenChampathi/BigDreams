const mongoose = require('mongoose');
const { getCollection } = require('../models/historical-stock-data.model');
const GapUps = require('../models/gap-up-stats.model');
const StockSymbols = require('../models/stocks.model');

const MINIMUM_VOLUME = 2000000;
const MINIMUM_GAP = 30;

const toISOStringLocal = (d, yearsBack) => {
  const z = (n) => {
    return (n < 10 ? '0' : '') + n;
  };
  const year = yearsBack ? d.getFullYear() - yearsBack : d.getFullYear();
  return year + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
};

mongoose
  .connect('mongodb://127.0.0.1:27017/dreams', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    StockSymbols.find({}, async (err, results) => {
      // Find symbols that are not in db
      // console.log(results);
      const db_results = results.map((r) => r.symbol);
      // console.log(db_results);
      for await (let symbol of db_results) {
        const StockSymbolCollection = getCollection(symbol);
        const documents = await StockSymbolCollection.find({}).sort({ TimeStamp: 1 });
        const documentsToLoad = documents
          .filter((doc, i) => {
            return doc.gapUp >= MINIMUM_GAP && doc.Volume >= MINIMUM_VOLUME;
          })
          .map(({ TimeStamp, HighPrice, OpenPrice, LowPrice, ClosePrice, Volume, VWAP, gapUp, PreviousClose }) => ({
            TimeStamp,
            HighPrice,
            OpenPrice,
            LowPrice,
            ClosePrice,
            Volume,
            VWAP,
            gapUp,
            PreviousClose,
            Symbol: symbol,
            _id: mongoose.Types.ObjectId(),
          }));
        GapUps.insertMany(documentsToLoad)
          .then(() => {
            console.log(symbol + ' Saved Successfully');
          })
          .catch((error) => {
            console.log(symbol + ' ' + error);
          });
      }
    });
  })
  .catch((err) => console.log(err));
