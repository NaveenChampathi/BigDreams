const express = require('express');
const finviz = require('finviz');

const router = express.Router();

router.get('/:ticker', (req, res, next) => {
    const ticker = req.params.ticker;
    finviz.getStockData(ticker)
    .then(data => {
        res.json({symbol: ticker, data: data});
    }).catch(err => console.log(err));
})

module.exports = router;