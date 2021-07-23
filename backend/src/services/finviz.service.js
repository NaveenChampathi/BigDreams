const finviz = require('finviz');

const getFundamentalsForTickers = (tickers) => {
    const fData = {};
    Promise.all(tickers.map(ticker => {
        finviz.getStockData(ticker)
        .then(data => {fData[ticker] = data})
    })).then(() => {
       return fData;
    });
}

module.exports = {
    getFundamentalsForTickers
}

