const mongoose = require('mongoose');

mongoose
  .connect('mongodb://127.0.0.1:27017/dreams', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const db = mongoose.connection.db;

    const regExp = /stock_history_symbol/;
    db.getCollectionNames()
      .filter(function (name) {
        return name.match(regExp);
      })
      .forEach(function (name) {
        // db.getCollection(name).drop();
        console.log(name);
      });
  });
