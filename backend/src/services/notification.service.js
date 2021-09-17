let _socket = null;
let _halts = [];

const registerSocket = (socket) => {
  _socket = socket;
};

const alertClient = (symbol, up) => {
  if (_socket) {
    _socket.emit('Alert', { swipe: up, symbol, message: `${symbol} ${up ? 'swipe' : 'flush'}` });
  }
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

const notifyHalts = (data) => {
  if (data.length !== _halts.length) {
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
