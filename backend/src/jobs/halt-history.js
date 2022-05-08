const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const parse = require('node-html-parser').parse;
const HaltHistory = require('../models/halt-history.model');
const { db } = require('../models/halt-history.model');

// Extend Date Class
Date.prototype.yyyymmdd = function () {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('');
};

// Converts html string to Json
const htmlToJson = (strHtml) => {
  const parsedHtml = parse(strHtml);

  const table = parsedHtml.querySelector('table');

  const headerRow = table.querySelectorAll('tr')[0];

  const dataRows = table.querySelectorAll('tr').splice(1);

  const headerCols = headerRow.querySelectorAll('th');

  const headers = [];
  const data = [];

  for (let i = 0; i < headerCols.length; i++) {
    let _header = headerCols[i].innerText.replace(/\s/g, '');
    _header = _header[0].toLowerCase() + _header.slice(1);
    headers.push(_header);
  }

  for (let i = 0; i < dataRows.length; i++) {
    const dataRow = dataRows[i];
    const dataRowCols = dataRow.querySelectorAll('td');
    const _data = {};

    for (let i = 0; i < dataRowCols.length; i++) {
      _data[headers[i]] = dataRowCols[i].innerText.trim();
    }

    data.push(_data);
  }

  return data;
};

const fetchHalts = (date) => {
  return fetch('https://www.nasdaqtrader.com/RPCHandler.axd', {
    headers: {
      referrer: 'https://www.nasdaqtrader.com/trader.aspx?id=TradingHaltHistory',
    },
    body: JSON.stringify({ method: 'BL_TradeHalt.GetHaltsByDate', params: '["20210420"]', version: '1.1' }),
    method: 'POST',
    mode: 'cors',
  })
    .then((res) => res.json())
    .then((json) => json);
};

// Fetch halts for a given date using puppeteer
async function fetchHaltsPuppeteer(date) {
  const browser = await puppeteer.launch({
    args: ['--enable-features=NetworkService', '--no-sandbox'],
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.once('request', (interceptedRequest) => {
    interceptedRequest.continue({
      method: 'POST',
      postData: JSON.stringify({ method: 'BL_TradeHalt.GetHaltsByDate', params: `["${date}"]`, version: '1.1' }),
      headers: {
        ...interceptedRequest.headers(),
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'sec-ch-ua': '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
        'sec-ch-ua-mobile': '?0',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        cookie:
          '_ga=GA1.1.1345350830.1624392923; ASP.NET_SessionId=s3c3jr42hrillvosgsq0aywy; _ga_WZ0WS1S3Y5=GS1.1.1629504860.9.1.1629505299.0',

        'content-type': 'application/json',
      },
    });
  });

  await page.setExtraHTTPHeaders({
    referer: 'https://www.nasdaqtrader.com/trader.aspx?id=TradingHaltHistory',
  });

  const response = await page.goto('https://www.nasdaqtrader.com/RPCHandler.axd');
  const jsonData = await response.json();

  await browser.close();

  return jsonData;
}

// Get dates

const getDatesToQuery = (dateUntil) => {
  let dateNow = Date.now();
  const MILLISECONDS_IN_A_DAY = 1000 * 60 * 60 * 24;

  let dateNowObj = new Date(dateNow);
  const dates = [];

  for (; dateNowObj.getFullYear() >= 2018; ) {
    if (dateUntil && dateNowObj.yyyymmdd() === dateUntil) {
      break;
    }
    dates.push(dateNowObj.yyyymmdd());
    dateNow = dateNow - MILLISECONDS_IN_A_DAY;
    dateNowObj = new Date(dateNow);
  }

  return dates;
};

const fetchHaltsJob = async () => {
  const dates = getDatesToQuery('20210920');
  // const dates = ['20220305']; - Tickers till date

  // console.log(dates);

  mongoose
    .connect('mongodb://127.0.0.1:27017/dreams', {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      for await (let date of dates) {
        try {
          const res = await fetchHaltsPuppeteer(date);
          const haltsData = htmlToJson(res.result).map((r) => ({
            _id: mongoose.Types.ObjectId(),
            ...r,
          }));

          // Store in mongo
          await HaltHistory.insertMany(haltsData)
            .then((value) => {
              console.log('Saved Successfully for ' + date);
            })
            .catch((error) => {
              console.log(error);
            });
        } catch (err) {
          console.log('Failed for ' + date);
          console.log(err);
        }
      }
    });
};

fetchHaltsJob();
