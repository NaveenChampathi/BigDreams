const mongoose = require('mongoose');
const express = require('express');
const moment = require('moment-timezone');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const VWAP = require('technicalindicators').VWAP;
const API_KEY = 'AKUZGQ4LP0JFTH8MLI8G';
const API_SECRET = 'SxyK42v8ziuSjtXiku9AEjKOLBT95C8xeu5GyzSb';
const { getCollection } = require('../../models/historical-stock-data.model');
const StockSymbols = require('../../models/stocks.model');
const GapUps = require('../../models/gap-up-stats.model');
const MarketOpenGapUps = require('../../models/market-open-stats.model');
const MultiDayRunners = require('../../models/multi-day-runner.model');

const alpaca = new Alpaca();

const router = express.Router();

const toISOStringLocal = (d, yearsBack) => {
  const z = (n) => {
    return (n < 10 ? '0' : '') + n;
  };
  const year = yearsBack ? d.getFullYear() - yearsBack : d.getFullYear();
  return year + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
};

const toISOStringLocalDays = (date, days, future = false) => {
  const z = (n) => {
    return (n < 10 ? '0' : '') + n;
  };

  const _date = date.replace(/-/g, '/');

  if (days) {
    const dateObj = new Date(
      new Date(_date).setDate(future ? new Date(_date).getDate() + days : new Date(_date).getDate() - days)
    );
    return dateObj.getFullYear() + '-' + z(dateObj.getMonth() + 1) + '-' + z(dateObj.getDate());
  } else {
    return date;
  }
};

router.get('/get-bars/:ticker', async (req, res, next) => {
  try {
    const resp = alpaca.getBarsV2(
      req.params.ticker,
      {
        start: toISOStringLocal(new Date(), 3),
        end: toISOStringLocal(new Date()),
        timeframe: '1Day',
      },
      alpaca.configuration
    );

    const bars = [];

    let previousClose = null;
    for await (let b of resp) {
      if (b.Volume > 2000000) {
        b.PreviousClose = previousClose;
        bars.push(b);
      }
      previousClose = b.ClosePrice;
    }

    res.json(bars);
  } catch (err) {
    console.log(err);
  }
});

router.get('/get-daily-bars/:date/:ticker', async (req, res, next) => {
  try {
    const resp = alpaca.getBarsV2(
      req.params.ticker,
      {
        start: toISOStringLocal(new Date(req.params.date), 3),
        end: req.params.date,
        timeframe: '1Day',
      },
      alpaca.configuration
    );

    const bars = [];

    let previousClose = null;
    for await (let b of resp) {
      bars.push(b);
      previousClose = b.ClosePrice;
    }

    res.json(bars);
  } catch (err) {
    console.log(err);
  }
});

router.get('/get-bars/intraday/:numberOfDaysBack/:numberOfDaysFuture/:date/:ticker/:timeframe', async (req, res, next) => {
  try {
    const resp = alpaca.getBarsV2(
      req.params.ticker,
      {
        start: toISOStringLocalDays(req.params.date, parseInt(req.params.numberOfDaysBack)) + 'T04:00:00-04:00',
        end: toISOStringLocalDays(req.params.date, parseInt(req.params.numberOfDaysFuture), true) + 'T20:00:00-04:00',
        timeframe: `${req.params.timeframe}Min`,
      },
      alpaca.configuration
    );
    console.log({
      start: toISOStringLocalDays(req.params.date, parseInt(req.params.numberOfDaysBack)) + 'T04:00:00-04:00',
      end: toISOStringLocalDays(req.params.date, parseInt(req.params.numberOfDaysFuture), true) + 'T20:00:00-04:00',
      timeframe: `${req.params.timeframe}Min`,
    });
    const bars = [];
    for await (let b of resp) {
      b.Timestamp = moment.tz(b.Timestamp, 'America/New_York').format();
      bars.push(b);
    }

    res.json(bars);
  } catch (err) {
    console.log(err);
  }
});

// router.get('/get-bars/intraday/:date/:ticker/:timeframe/', async (req, res, next) => {
//   try {
//     const resp = alpaca.getBarsV2(
//       req.params.ticker,
//       {
//         start: toISOStringLocalDays(req.params.date, 3) + 'T04:00:00-04:00',
//         end: toISOStringLocalDays(req.params.date, 1, true) + 'T20:00:00-04:00',
//         timeframe: `${req.params.timeframe}Min`,
//       },
//       alpaca.configuration
//     );

//     const bars = [];
//     for await (let b of resp) {
//       b.Timestamp = moment.tz(b.Timestamp, 'America/New_York').format();
//       bars.push(b);
//     }

//     res.json(bars);
//   } catch (err) {
//     console.log(err);
//   }
// });

router.get('/get-trades/intraday/:date/:ticker', async (req, res, next) => {
  try {
    const resp = alpaca.getTradesV2(
      req.params.ticker,
      {
        start: req.params.date + 'T09:30:00-04:00',
        end: req.params.date + 'T20:00:00-04:00',
      },
      alpaca.configuration
    );

    const trades = [];
    for await (let b of resp) {
      b.Timestamp = moment.tz(b.Timestamp, 'America/New_York').format();
      trades.push(b);
    }

    res.json(trades);
  } catch (err) {
    console.log(err);
  }
});

router.get('/get-trades/:start/:end/:ticker', async (req, res, next) => {
  try {
    const resp = alpaca.getTradesV2(
      req.params.ticker,
      {
        start: req.params.start,
        end: req.params.end,
      },
      alpaca.configuration
    );

    const trades = [];
    for await (let b of resp) {
      b.Timestamp = moment.tz(b.Timestamp, 'America/New_York').format();
      trades.push(b);
    }

    res.json(trades);
  } catch (err) {
    console.log(err);
  }
});

router.get('/technicals/:ticker', async (req, res, next) => {
  const resp = alpaca.getBarsV2(
    req.params.ticker,
    {
      start: toISOStringLocal(new Date(), 1),
      end: toISOStringLocal(new Date()),
      timeframe: '1Day',
    },
    alpaca.configuration
  );

  const bars = [];
  const inputVWAP = {
    open: [],
    high: [],
    low: [],
    close: [],
    volume: [],
  };

  for await (let b of resp) {
    // b = addCummulativeVWAP(b);
    inputVWAP.high.push(b.HighPrice);
    inputVWAP.low.push(b.LowPrice);
    inputVWAP.close.push(b.ClosePrice);
    inputVWAP.volume.push(b.Volume);
    bars.push(b);
    // if(b.Volume > 2000000) {
    //   bars.push(b);
    // }
  }

  const resultVWAP = VWAP.calculate(inputVWAP);

  const _bars = bars.map((b, i) => {
    b.vwap = resultVWAP[i].toFixed(2);
    return b;
  });

  res.json({ success: true });
});

const getAllGappedTickers = () => {
  return async (req, res, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skipIndex = (page - 1) * limit;
    const results = {};
    // let _results = [];
    // const { gapUp, volume } = req.query;
    try {
      await GapUps.find({}, async (err, results) => {
        res.data = { results: results.filter(({ OpenPrice }) => OpenPrice >= 3) };
        console.log('processingDone');
        next();
      })
        .sort({ TimeStamp: -1 })
        .limit(limit)
        .skip(skipIndex)
        .exec();
    } catch (e) {
      res.status(500).json({ message: 'Error Occured' });
    }
  };
};
const getAllMorningOpenGappedTickers = () => {
  return async (req, res, next) => {
    // let _results = [];
    // const { gapUp, volume } = req.query;
    try {
      await MarketOpenGapUps.find({}, async (err, results) => {
        res.data = { results: results.filter(({ OpenPrice }) => OpenPrice >= 2) };
        console.log('processingDone');
        next();
      });
    } catch (e) {
      res.status(500).json({ message: 'Error Occured' });
    }
  };
};
const getAllMultiDayTickers = () => {
  return async (req, res, next) => {
    // let _results = [];
    // const { gapUp, volume } = req.query;
    try {
      await MultiDayRunners.find({}, async (err, results) => {
        res.data = { results: results.filter(({ OpenPrice }) => OpenPrice >= 3) };
        console.log('processingDone');
        next();
      });
    } catch (e) {
      res.status(500).json({ message: 'Error Occured' });
    }
  };
};

router.get('/get-all-gapped-tickers', getAllGappedTickers(), (req, res) => {
  res.json(res.data);
});
router.get('/get-all-morning-open-gapped-tickers', getAllMorningOpenGappedTickers(), (req, res) => {
  res.json(res.data);
});

router.get('/get-all-multi-day-tickers', getAllMultiDayTickers(), (req, res) => {
  res.json(res.data);
});

router.post('/mark-ticker', async (req, res) => {
  const { id, type, value } = req.body;

  try {
    await GapUps.updateOne({ _id: id }, { $set: { [type]: value } }, (e) => {
      if (e) {
        res.json(e);
        return;
      }

      res.json({ success: true });
    });
  } catch (e) {
    res.status(500).json({ message: 'Error Occured' });
  }
});

// News API
router.get('/news/:date/:ticker/', async (req, res, next) => {
  try {
    const news = await alpaca.getNews(
      {
        symbols: [req.params.ticker],
        start: toISOStringLocalDays(req.params.date, 4) + 'T04:00:00-04:00',
        end: toISOStringLocalDays(req.params.date, 4, true) + 'T20:00:00-04:00',
        exclude_contentless: true,
        limit: '50',
      },
      alpaca.configuration
    );

    res.json(news);
  } catch (err) {
    console.log(err);
    res.json([]);
    des;
  }
});

module.exports = router;
