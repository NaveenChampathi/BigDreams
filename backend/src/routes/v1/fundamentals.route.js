const express = require('express');
const { getStockData } = require('../../services/finviz.service');
const { getCompanyHomeURL } = require('../../services/bamsec.service');

const router = express.Router();

router.get('/:ticker', (req, res, next) => {
  const ticker = req.params.ticker;
  getStockData(ticker)
    .then((data) => {
      res.json({ symbol: ticker, data: data });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send({
        err,
      });
    });
});

router.get('/bam-sec/:ticker', (req, res, next) => {
  const ticker = req.params.ticker;
  getCompanyHomeURL(ticker)
    .then((data) => {
      res.json({ symbol: ticker, data: data });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send({
        err,
      });
    });
});

module.exports = router;
