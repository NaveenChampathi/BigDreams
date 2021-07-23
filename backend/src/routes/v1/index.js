const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const dataStreamRoute = require('./datastream.route');
const historyRoute = require('./history.route');
const watchlistRoute = require('./watchlist.route');
const snapshotRoute = require('./snapshot.route');
const fundamentalsRoute = require('./fundamentals.route');
const haltsRoute = require('./halts.route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/data-stream',
    route: dataStreamRoute
  },
  {
    path: '/history',
    route: historyRoute
  },
  {
    path: '/watchlist',
    route: watchlistRoute
  },
  {
    path: '/snapshot',
    route: snapshotRoute
  },
  {
    path: '/fundamentals',
    route: fundamentalsRoute
  },
  {
    path: '/halts',
    route: haltsRoute
  }
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
