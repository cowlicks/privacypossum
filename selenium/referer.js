'use strict';

const express = require('express'),
  {requestRecorderMiddleware, baseTestApp} = require('./utils');

function requireRefererApp(app = express()) {
  app.use((req, res, next) => {
    if (!req.headers['referer']) {
      res.statusCode = 401;
      return res.send();
    }
    next();
  });
  requestRecorderMiddleware(app);
  return app;
}

function refererApp() {
  let fpApp = express(),
    tpApp = requireRefererApp();
  return baseTestApp(fpApp, tpApp);
}

Object.assign(module.exports, {refererApp});
