const mongoose = require('mongoose');

// Course Modal Schema
const haltHistoryModel = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  haltDate: String,
  haltTime: String,
  issueSymbol: String,
  issueName: String,
  market: String,
  reasonCode: String,
  pauseThresholdPrice: String,
  resumptionDate: String,
  resumptionQuoteTime: String,
  resumptionTradeTime: String,
  validHaltResumeEntry: Boolean,
  validMarketOpenHaltEntry: Boolean,
  dayVolume: Number,
  haltedBarStat: {
    type: Map,
    of: String,
  },
  intradayHighAfterHalt: {
    type: Map,
    of: String,
  },
  intradayLowAfterHalt: {
    type: Map,
    of: String,
  },
});

const HaltHistory = mongoose.model('halt_history', haltHistoryModel);

module.exports = HaltHistory;
