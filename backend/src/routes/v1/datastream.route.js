const express = require('express');
const axios = require('axios');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const { alertClient, alertClientHOD, notifyLastTrade } = require('../../services/notification.service');
const { registerGainersPollingId } = require('../../utils/pollingHelper');

// const API_KEY = 'AKUZGQ4LP0JFTH8MLI8G';
// const API_SECRET = 'SxyK42v8ziuSjtXiku9AEjKOLBT95C8xeu5GyzSb';
let lastPricesFromBars = {};
const lastTradesForSymbol = {};
const intradayStatsForTickers = {};
let currentTickersBeingWatched = [];

let watchlistId = '';
let dataStreamConnectionsActive = 0;
let dataStreamConnectionPromiseResolve = () => { };

class DataStream {
  constructor({ apiKey, secretKey, feed }) {
    this.alpaca = new Alpaca({
      keyId: apiKey,
      secretKey,
      feed,
    });

    const alpacaConfig = this.alpaca.configuration;

    const socket = this.alpaca.data_stream_v2;

    const getSnapshots = (tickers) => {
      this.alpaca.getSnapshots(tickers, alpacaConfig).then(data => {
        data.forEach(d => {
          intradayStatsForTickers[d.symbol] = {
            today: d.DailyBar,
            previousDay: d.PrevDailyBar
          }
        })
      });
    }

    socket.onConnect(() => {
      console.log('Connected');
      dataStreamConnectionsActive++;
      dataStreamConnectionPromiseResolve();
      this.alpaca.getWatchlist(watchlistId).then((res) => {
        let tickers = [];
        if (res.assets) {
          tickers = res.assets.map((r) => r.symbol);
        }

        if (tickers.length) {
          // socket.subscribeForQuotes(tickers);
          socket.subscribeForBars(tickers);
          socket.subscribeForTrades(tickers);
        }
      });

      axios.get('https://securitiesapi.webullfintech.com/api/securities/market/v5/card/stockActivityPc.advanced/list?regionId=6&userRegionId=1&hasNum=0&pageSize=100').then(response => {
        const { data } = response;
        const tickers = data.filter(d => d.volume > 100000 && d.symbol.length < 5);
        currentTickersBeingWatched = tickers.map(t => t.symbol);
        socket.subscribeForBars(currentTickersBeingWatched);
        socket.subscribeForTrades(currentTickersBeingWatched);
        getSnapshots(currentTickersBeingWatched);
      });

      const _intervalId = setInterval(() => {
        axios.get('https://securitiesapi.webullfintech.com/api/securities/market/v5/card/stockActivityPc.advanced/list?regionId=6&userRegionId=1&hasNum=0&pageSize=100').then(response => {
          const { data } = response;
          const tickers = data.filter(d => d.volume > 100000 && d.symbol.length < 5).map(t => t.symbol);
          const additionalTickers = tickers.filter(t => currentTickersBeingWatched.indexOf(t) < 0);

          if (additionalTickers.length) {
            socket.subscribeForBars(additionalTickers);
            socket.subscribeForTrades(additionalTickers);
            getSnapshots(additionalTickers);
          }
          currentTickersBeingWatched = [...currentTickersBeingWatched, ...additionalTickers];
        });
      }, 30000);
      registerGainersPollingId(_intervalId);

    });

    socket.onError((err) => {
      console.log(err);
    });

    socket.onStockTrade((trade) => {
      // console.log(trade);
      // if(lastTradesForSymbol[trade.Symbol]) {
      //   const increased = trade.Price > lastTradesForSymbol[trade.Symbol].Price;
      //   lastTradesForSymbol[trade.Symbol] = {...trade, increased}
      // } else {
      //   lastTradesForSymbol[trade.Symbol] = trade;
      // }
      // notifyLastTrade(lastTradesForSymbol);

      const PERCENTAGE_DEVIATION = 3;
      const NOTIFY_EVERY_N_MINUTES = 2;

      const intradayTickerData = intradayStatsForTickers[trade.Symbol] ? intradayStatsForTickers[trade.Symbol].today : {};

      const { HighPrice, LowPrice, lastNotified } = intradayTickerData;

      if (HighPrice) {
        const percentageDeviation = ((HighPrice - trade.Price) / HighPrice) * 100;

        if (percentageDeviation <= PERCENTAGE_DEVIATION && percentageDeviation >= -(PERCENTAGE_DEVIATION)) {
          if (lastNotified) {
            const numberOfMilliSecondsApart = NOTIFY_EVERY_N_MINUTES * 60 * 1000;
            if ((Date.now() - lastNotified) > numberOfMilliSecondsApart) {
              // Notify Client
              alertClientHOD({ symbol: trade.Symbol, now: Date.now(), lastNotified: lastNotified });
              // console.log(trade.Symbol);
              // console.log(percentageDeviation);
              intradayTickerData.lastNotified = Date.now();
            }
          } else {
            // Notify Client
            alertClientHOD({ symbol: trade.Symbol, now: Date.now() });
            // console.log(trade.Symbol);
            // console.log(percentageDeviation);
            intradayTickerData.lastNotified = Date.now();
          }
        }

        if (trade.Price > HighPrice) {
          intradayTickerData.HighPrice = trade.Price;
        }

        intradayStatsForTickers[trade.Symbol].today = intradayTickerData;
      }

    });

    socket.onStockQuote((quote) => {
      // console.log(quote);
    });

    socket.onStockBar((bar) => {
      lastPricesFromBars[bar.Symbol] = bar;

      const delta = bar.OpenPrice * 0.07;

      if (bar.HighPrice - bar.LowPrice >= delta && bar.OpenPrice > bar.ClosePrice) {
        alertClient(bar.Symbol, false);
      }

      if (bar.HighPrice - bar.LowPrice >= delta && bar.OpenPrice < bar.ClosePrice) {
        alertClient(bar.Symbol, true);
      }
    });

    socket.onStateChange((state) => {
      console.log(state);
    });

    socket.onDisconnect(() => {
      console.log('Disconnected');
      if (dataStreamConnectionsActive > 0) {
        dataStreamConnectionsActive--;
      }
      lastPricesFromBars = {};
      dataStreamConnectionPromiseResolve = () => { };
    });
  }
}

let stream = new DataStream({
  feed: 'sip',
});

const router = express.Router();

router.get('/connect/:id', (req, res, next) => {
  watchlistId = req.params.id;
  const _dataStreamConnectionPromise = new Promise((res, rej) => {
    dataStreamConnectionPromiseResolve = res;
  });
  stream.alpaca.data_stream_v2.connect();
  _dataStreamConnectionPromise.then(() => res.json({ success: true }));
});

router.get('/disconnect', (req, res, next) => {
  stream.alpaca.data_stream_v2.disconnect();
  lastPricesFromBars = {};
  res.json({ success: true });
});

router.get('/status', (req, res, next) => {
  res.json({ connectionActive: dataStreamConnectionsActive > 0, count: dataStreamConnectionsActive });
});

module.exports = router;
