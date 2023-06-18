const axios = require('axios');
const express = require('express');
const parseString = require('xml2js').parseString;

const { notifyHalts } = require('../../services/notification.service');
const { registerHaltsPollingId } = require('../../utils/pollingHelper');
const HaltHistory = require('../../models/halt-history.model');

const router = express.Router();

router.get('/nasdaq', (req, res, next) => {
  axios.get('http://www.nasdaqtrader.com/rss.aspx?feed=tradehalts').then((response) => {
    const { data } = response;
    parseString(data, function (err, result) {
      let { item } = result.rss.channel[0];
      item = item.map((i) => ({
        ticker: i.title[0],
        haltDate: i['ndaq:HaltDate'][0],
        haltTime: i['ndaq:HaltTime'][0],
        reasonCode: i['ndaq:ReasonCode'][0],
        resumptionDate: i['ndaq:ResumptionDate'][0],
        resumptionTime: i['ndaq:ResumptionTradeTime'][0],
      }));
      notifyHalts(item);
    });
  });
  const _intervalId = setInterval(() => {
    axios.get('http://www.nasdaqtrader.com/rss.aspx?feed=tradehalts').then((response) => {
      const { data } = response;
      parseString(data, function (err, result) {
        let { item } = result.rss.channel[0];
        item = item.map((i) => ({
          ticker: i.title[0],
          haltDate: i['ndaq:HaltDate'][0],
          haltTime: i['ndaq:HaltTime'][0],
          reasonCode: i['ndaq:ReasonCode'][0],
          resumptionDate: i['ndaq:ResumptionDate'][0],
          resumptionTime: i['ndaq:ResumptionTradeTime'][0],
        }));
        notifyHalts(item);
      });
    });
  }, 60000);
  registerHaltsPollingId(_intervalId);
  res.json({ success: true });
});

const paginatedResults = () => {
  return async (req, res, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skipIndex = (page - 1) * limit;
    const results = {};

    try {
      // results.results = await HaltHistory.aggregate([
      //   {
      //     $project: {
      //       date: {
      //         $dateFromString: {
      //           dateString: '$haltDate',
      //         },
      //       },
      //     },
      //   },
      //   { $sort: { date: -1 } },
      // ])
      results.results = await HaltHistory.find({ reasonCode: 'LUDP', validHaltResumeEntry: true })
        .limit(limit)
        .skip(skipIndex)
        .exec();
      res.paginatedResults = results;
      next();
    } catch (e) {
      res.status(500).json({ message: 'Error Occured' });
    }
  };
};

const getAllHaltedCrap = () => {
  return async (req, res, next) => {
    const results = {};

    try {
      results.results = await HaltHistory.find({ reasonCode: 'LUDP' }).exec();
      res.data = results;
      next();
    } catch (e) {
      res.status(500).json({ message: 'Error Occured' });
    }
  };
};

router.get('/get-halted-tickers', paginatedResults(), (req, res) => {
  res.json(res.paginatedResults);
});

router.post('/mark-ticker', async (req, res) => {
  const { id, type, value } = req.body;

  try {
    await HaltHistory.updateOne({ _id: id }, { $set: { [type]: value } }, (e) => {
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

router.get('/get-all-halted-crap', getAllHaltedCrap(), (req, res) => {
  res.json(res.data);
});

module.exports = router;
