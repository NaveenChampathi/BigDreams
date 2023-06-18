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
  PreviousClose: Number,
  Symbol: String,
  validGapupType1: Boolean,
  validGapupType2: Boolean,
});

const GapUps = mongoose.model('gapups_gte_30', __Model);

module.exports = GapUps;
