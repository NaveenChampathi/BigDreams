
const axios = require('axios');
const express = require('express');
const parseString = require('xml2js').parseString;

const { notifyHalts } = require('../../services/notification.service');
const { registerHaltsPollingId } = require('../../utils/pollingHelper');

const router = express.Router();

  router.get(
    '/nasdaq',
     (req, res, next) => {
        
        axios.get('http://www.nasdaqtrader.com/rss.aspx?feed=tradehalts').then(response => {
            const {data} = response;
            parseString(data, function (err, result) {
                let { item } = result.rss.channel[0];
                item = item.map(i => ({
                    ticker: i.title[0],
                    haltDate: i["ndaq:HaltDate"][0],
                    haltTime: i["ndaq:HaltTime"][0],
                    reasonCode: i["ndaq:ReasonCode"][0],
                    resumptionDate: i["ndaq:ResumptionDate"][0],
                    resumptionTime: i["ndaq:ResumptionTradeTime"][0]
                }));
                notifyHalts(item);
            });
        });
         const _intervalId = setInterval(() => {
            axios.get('http://www.nasdaqtrader.com/rss.aspx?feed=tradehalts').then(response => {
              const {data} = response;
              parseString(data, function (err, result) {
                  let {item} = result.rss.channel[0];
                  item = item.map(i => ({
                      ticker: i.title[0],
                      haltDate: i["ndaq:HaltDate"][0],
                      haltTime: i["ndaq:HaltTime"][0],
                      reasonCode: i["ndaq:ReasonCode"][0],
                      resumptionDate: i["ndaq:ResumptionDate"][0],
                      resumptionTime: i["ndaq:ResumptionTradeTime"][0]
                  }));
                  notifyHalts(item);
              });
              
            });
         }, 60000);
         registerHaltsPollingId(_intervalId);
         res.json({success: true});
    }
  );

module.exports = router;