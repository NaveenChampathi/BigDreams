const { sendSMS } = require('./sms.service');

let _socket = null;
let _halts = [];

const registerSocket = (socket) => {
  _socket = socket;
};

const alertClient = (symbol, up) => {
  if (_socket) {
    _socket.emit('Alert', { swipe: up, symbol, message: `${symbol} ${up ? 'swipe' : 'flush'}` });
  }
  sendSMS(`${symbol} ${up ? 'swipe' : 'flush'}`);
};

const alertClientHOD = ({ symbol, lastNotified, now, count }) => {
  if (_socket) {
    _socket.emit('AlertHOD', { symbol, lastNotified, now, count });
  }
};

const notifyLastTrade = (data) => {
  if (_socket) {
    _socket.emit('LastTrade', data);
  }
};

const notifyTickerFundamentals = (data) => {
  if (_socket) {
    _socket.emit('TickerFundamentals', data);
  }
};

const notifyGainers = (data) => {
  if (_socket) {
    _socket.emit('gainers', data);
  }
};

const haltSMS = ({ ticker, haltDate, haltTime, resumptionDate, resumptionTime, reasonCode }) => {
  const message = `${ticker} (${reasonCode}) halted ${haltDate} ${haltTime} and resumes ${resumptionDate} ${resumptionTime}`;
  sendSMS(message);
};

const notifyHalts = (data) => {
  if (data.length !== _halts.length) {
    const latestHalt = _halts[0] || {};
    for (let i = 0; i < data.length; i++) {
      if (data[i].haltTime !== latestHalt.haltTime && data[i].ticker !== latestHalt.ticker) {
        haltSMS(data[i]);
      } else {
        break;
      }
    }

    _halts = data;
  }
  if (_socket) {
    _socket.emit('Halts', _halts);
  }
};

module.exports = {
  registerSocket,
  alertClient,
  alertClientHOD,
  notifyLastTrade,
  notifyTickerFundamentals,
  notifyGainers,
  notifyHalts,
};
