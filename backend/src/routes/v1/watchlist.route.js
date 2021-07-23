const express = require('express');
const Alpaca = require("@alpacahq/alpaca-trade-api");
const API_KEY = "AKUZGQ4LP0JFTH8MLI8G";
const API_SECRET = "SxyK42v8ziuSjtXiku9AEjKOLBT95C8xeu5GyzSb";

const alpaca = new Alpaca();

const router = express.Router();

router.post(
  '/add',
   (req, res, next) => {
        const {id, symbol} = req.body;
        alpaca.addToWatchlist(id, symbol).then((response) => {
            res.json(response);
        }).catch((err) => {
          next(err);
        });
  }
);

router.post(
    '/delete',
     (req, res, next) => {
        const {id, symbol} = req.body;
        alpaca.deleteFromWatchlist(id, symbol).then((response) => {
            res.json(response);
        }).catch((err) => {
          next(err);
        });
    }
  );

  router.get(
    '/all',
     (req, res, next) => {
        alpaca.getWatchlists().then((response) => {
            res.json(response);
          }).catch((err) => {
            next(err);
          });
    }
  );

  router.get(
    '/:id',
     (req, res, next) => {
        alpaca.getWatchlist(req.params.id).then((response) => {
            res.json(response);
          }).catch((err) => {
            next(err);
          });
    }
  );

module.exports = router;