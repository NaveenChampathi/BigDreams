const mongoose = require('mongoose');

const __Model = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  TimeStamp: String,
  HighPrice: Number,
  OpenPrice: Number,
  LowPrice: Number,
  ClosePrice: Number,
  Volume: Number,
  VWAP: Number,
  gapUp: Number,
  marketOpenGapup: Number,
  PreviousClose: Number,
  Symbol: String,
});

const MarketOpenGapUps = mongoose.model('market_open_gapups_gte_30', __Model);

module.exports = MarketOpenGapUps;
