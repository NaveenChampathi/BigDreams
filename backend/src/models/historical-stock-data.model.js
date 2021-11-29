const mongoose = require('mongoose');

// Course Modal Schema
const stockHistoryModel = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    TimeStamp: String,
    HighPrice: Number,
    OpenPrice: Number,
    LowPrice: Number,
    ClosePrice: Number,
    Volume: Number,
    VWAP: Number,
    gapUp: Number,
    PreviousClose: Number,
    
  },
  { collection: 'data' }
);

const getCollection = (symbol) => {
  const StockHistoryCollection = mongoose.model(
    `stock_history_symbol_${symbol}`,
    stockHistoryModel,
    `stock_history_symbol_${symbol}`
  );
  return StockHistoryCollection;
};

module.exports = { getCollection };
