const mongoose = require('mongoose');
  
// Course Modal Schema
const stockSymbol = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    symbol: String,
});

const StockSymbols = mongoose.model('stock_symbols', stockSymbol);

module.exports = StockSymbols;