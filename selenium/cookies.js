'use strict';

const express = require('express'),
  cookieParser = require('cookie-parser'),
  {firstPartyHostname, thirdPartyHostname, thirdPartyHost, Channel, requestRecorderMiddleware} = require('./utils'),
  vhost = require('vhost');

let fpcookie = {name: '1pname', value: '1pvalue'},
  tpcookie = {name: '3pname', value: '3pvalue'};

function firstPartyApp(app = requestRecorderMiddleware(), tpHost = thirdPartyHost) {
  app.use(cookieParser());
  app.get('/', (req, res) => {
    res.cookie(fpcookie.name, fpcookie.value);
    return res.send(
      `<script type="text/javascript" src="http://${tpHost}/tracker.js"></script>`
    );
  });
  return app;
}

function thirdPartyApp(app = requestRecorderMiddleware()) {
  app.use(cookieParser());
  app.get('/tracker.js', (req, res) => {
    res.cookie(tpcookie.name, tpcookie.value);
    return res.send('console.log("third party script")');
  });
  return app;
}

function cookieApp(app = express(), fpHostname = firstPartyHostname, tpHostname = thirdPartyHostname) {
  let firstParty = firstPartyApp(),
    thirdParty = thirdPartyApp();
  app.use(vhost(fpHostname, firstParty));
  app.use(vhost(tpHostname, thirdParty));
  Object.assign(app, {firstParty, thirdParty});
  return app;
}

Object.assign(module.exports, {cookieApp, fpcookie, tpcookie});
