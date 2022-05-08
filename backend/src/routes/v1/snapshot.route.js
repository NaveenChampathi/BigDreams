const express = require('express');
const finviz = require('finviz');
const axios = require('axios');
const { notifyGainers } = require('../../services/notification.service');

const { notifyTickerFundamentals } = require('../../services/notification.service');

const { registerGainersPollingId } = require('../../utils/pollingHelper');
const { isPreMarketTime } = require('../../utils');

const tickersFundamentals = {};

const startProcessForFundamentalDataFetch = (tickers) => {
  tickers.map((ticker) => {
    finviz
      .getStockData(ticker)
      .then((data) => {
        tickersFundamentals[ticker] = data;
        notifyTickerFundamentals({ ticker, data });
      })
      .catch((err) => console.log(err));
  });
};

const router = express.Router();

router.get('/gainers', (req, res, next) => {
  const _isPreMarketTime = isPreMarketTime();
  const URL = _isPreMarketTime
    ? 'https://quoteapi.webullbroker.com/api/wlas/rank/v2/faRealtime?regionId=6&showNumber=100&type=2'
    : 'https://securitiesapi.webullfintech.com/api/securities/market/v5/card/stockActivityPc.advanced/list?regionId=6&userRegionId=1&hasNum=0&pageSize=100';
  axios.get(URL).then((response) => {
    let data = [];
    if (_isPreMarketTime) {
      data = response.data.data;
    } else {
      data = response.data;
    }
    const tickers = data
      .filter((d) => d.volume > 100000 && d.symbol.length < 5)
      .map((d) => {
        d.pPrice = _isPreMarketTime ? d.positionPrice : d.pPrice;
        return d;
      });
    notifyGainers(tickers);
  });
  const _intervalId = setInterval(() => {
    const _isPreMarketTime = isPreMarketTime();
    const URL = _isPreMarketTime
      ? 'https://quoteapi.webullbroker.com/api/wlas/rank/v2/faRealtime?regionId=6&showNumber=100&type=2'
      : 'https://securitiesapi.webullfintech.com/api/securities/market/v5/card/stockActivityPc.advanced/list?regionId=6&userRegionId=1&hasNum=0&pageSize=100';

    axios.get(URL).then((response) => {
      let data = [];
      if (_isPreMarketTime) {
        data = response.data.data;
      } else {
        data = response.data;
      }
      const tickers = data
        .filter((d) => d.volume > 100000 && d.symbol.length < 5)
        .map((d) => {
          d.pPrice = _isPreMarketTime ? d.positionPrice : d.pPrice;
          return d;
        });
      notifyGainers(tickers);
    });
  }, 30000);
  registerGainersPollingId(_intervalId);
  res.json({ success: true });
});

module.exports = router;
