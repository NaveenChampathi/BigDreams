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
});

const MultiDayRunners = mongoose.model('multi_day_runner', __Model);

module.exports = MultiDayRunners;
