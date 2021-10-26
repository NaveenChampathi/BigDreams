const toISOStringLocal = (d, yearsBack) => {
  const z = (n) => {
    return (n < 10 ? '0' : '') + n;
  };
  const year = yearsBack ? d.getFullYear() - yearsBack : d.getFullYear();
  return year + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
};

module.exports = {
  toISOStringLocal,
};
