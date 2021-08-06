const mongoose = require('mongoose');
  
// Course Modal Schema
const stockSymbol = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    TimeStamp: String,
    High: Number,
    Open: Number,
    Low: Number,
    Close: Number,
    Volume: Number
});

const createCollections = (symbols) => {
    
}

const StockSymbols = mongoose.model('stock_symbols', stockSymbol);

module.exports = StockSymbols;