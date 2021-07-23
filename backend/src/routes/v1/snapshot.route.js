const express = require('express');
const finviz = require('finviz');
const axios = require('axios');
const { notifyGainers } = require('../../services/notification.service');

const { notifyTickerFundamentals } = require('../../services/notification.service');

const { registerGainersPollingId } = require('../../utils/pollingHelper');

const tickersFundamentals = {};

const startProcessForFundamentalDataFetch = (tickers) => {
    tickers.map(ticker => {
        finviz.getStockData(ticker)
        .then(data => {
            tickersFundamentals[ticker] = data;
            notifyTickerFundamentals({ticker,
            data});
        }).catch(err => console.log(err));
    })
}

const router = express.Router();

  router.get(
    '/gainers',
     (req, res, next) => {
         const URL = true ? 'https://quoteapi.webullbroker.com/api/wlas/rank/v2/faRealtime?regionId=6&showNumber=100&type=2' : 'https://securitiesapi.webullfintech.com/api/securities/market/v5/card/stockActivityPc.advanced/list?regionId=6&userRegionId=1&hasNum=0&pageSize=100';
        axios.get('https://securitiesapi.webullfintech.com/api/securities/market/v5/card/stockActivityPc.advanced/list?regionId=6&userRegionId=1&hasNum=0&pageSize=100').then(response => {
            const {data} = response;
            const tickers = data.filter(d => d.volume > 100000 && d.symbol.length < 5);
            notifyGainers(tickers);
        });
         const _intervalId = setInterval(() => {
            axios.get('https://securitiesapi.webullfintech.com/api/securities/market/v5/card/stockActivityPc.advanced/list?regionId=6&userRegionId=1&hasNum=0&pageSize=100').then(response => {
                const {data} = response;
                const tickers = data.filter(d => d.volume > 100000 && d.symbol.length < 5);
                notifyGainers(tickers);
                // startProcessForFundamentalDataFetch(tickers.map(t => t.symbol));
                
                // getFundamentalsForTickers(tickers.map(t => t.symbol)).then(fData => {
                //     tickers = tickers.map(t => {
                //         return {
                //             ...t,
                //             ...fData[t.symbol]
                //         }
                //     })
                // })
            });
         }, 30000);
         registerGainersPollingId(_intervalId);
         res.json({success: true});
    }
  );

module.exports = router;