const toISOStringLocal = (d, yearsBack) => {
  const z = (n) => {
    return (n < 10 ? '0' : '') + n;
  };
  const year = yearsBack ? d.getFullYear() - yearsBack : d.getFullYear();
  return year + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
};

const isPreMarketTime = () => {
  // const { getUTCHours, getUTCMinutes } = new Date();

  // const UTCHours = getUTCHours();
  // const UTCMinutes = getUTCMinutes();

  // if (UTCHours < 14) {
  //   return true;
  // } else {
  //   if (UTCHours === 14 && UTCMinutes <= 30) {
  //     return true;
  //   }
  // }
  // return false;

  // const { getHours, getMinutes } = new Date();

  const UTCHours = new Date().getHours();
  const UTCMinutes = new Date().getMinutes();

  if (UTCHours < 8) {
    return true;
  } else {
    if (UTCHours === 8 && UTCMinutes <= 30) {
      return true;
    }
  }
  return false;
};

module.exports = {
  toISOStringLocal,
  isPreMarketTime,
};
