const mongoose = require('mongoose');
  
// Course Modal Schema
const symbolHOD = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    symbol: String, 
    now: Number, 
    lastNotified: Number, 
    count: Number
});



const SymbolHOD = mongoose.model('alerts_hod_08172021', symbolHOD);

module.exports = SymbolHOD;