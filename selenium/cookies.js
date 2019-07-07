'use strict';

const express = require('express'),
  cookieParser = require('cookie-parser'),
  {requestRecorderMiddleware, baseTestApp} = require('./utils');

let fpcookie = {name: '1pname', value: '1pvalue'},
  tpcookie = {name: '3pname', value: '3pvalue'};


function cookieSetterApp(cookieName, cookieValue, app = express()) {
  app.use(cookieParser());
  app.use((req, res, next) => {
    res.cookie(cookieName, cookieValue);
    next();
  });
  requestRecorderMiddleware(app);
  return app;
}

function cookieApp() {
  let fpApp = cookieSetterApp(fpcookie.name, fpcookie.value),
    tpApp = cookieSetterApp(tpcookie.name, tpcookie.value);
  return baseTestApp(fpApp, tpApp);
}

Object.assign(module.exports, {cookieApp, fpcookie, tpcookie});
