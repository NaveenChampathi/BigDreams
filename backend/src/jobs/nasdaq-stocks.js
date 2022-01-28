const csvFilePath = __dirname + '/nasdaq_screener.csv';
const csv = require('csvtojson');
const mongoose = require('mongoose');

// const config = require('../config/config');
const StockSymbols = require('../models/stocks.model');

const MARKET_CAP_UPPER_LIMIT = 500000001;

// console.log(__dirname + '/nasdaq_screener.csv');

csv()
  .fromFile(csvFilePath)
  .then((jsonObj) => {
    const filteredJson = jsonObj.filter((j) => parseInt(j['Market Cap']) < MARKET_CAP_UPPER_LIMIT && j.Symbol.length < 5);
    //   .map((j) => ({ _id: mongoose.Types.ObjectId(), symbol: j.Symbol }));
    // console.log(filteredJson);

    // mongoose connection
    mongoose
      .connect('mongodb://127.0.0.1:27017/dreams', {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        StockSymbols.find({}, (err, results) => {
          // Find symbols that are not in db
          const db_results = results.map((r) => r.symbol);
          let symbolsToSave = filteredJson.filter((j) => db_results.indexOf(j.Symbol) < 0);

          symbolsToSave = symbolsToSave.map((j) => ({ _id: mongoose.Types.ObjectId(), symbol: j.Symbol }));

          StockSymbols.insertMany(symbolsToSave)
            .then((value) => {
              console.log('Saved Successfully');
              mongoose.connection.close();
            })
            .catch((error) => {
              console.log(error);
              mongoose.connection.close();
            });
        });
      });
  });
