'use strict';

const express = require('express'),
  cookieParser = require('cookie-parser'),
  {createServer} = require('http'),
  vhost = require('vhost');

let fpcookie = {name: '1pname', value: '1pvalue'},
  tpcookie = {name: '3pname', value: '3pvalue'};

class Channel {
  constructor() {
    this.items = [];
    this.waiting = [];
  }
  async popQueue() {
    if (this.items.length > 0) {
      return this.items.pop();
    } else {
      return new Promise((resolve) => {
        this.waiting.push(resolve);
      });
    }
  }
  async next() {
    return await this.popQueue();
  }
  push(item) {
    if (this.waiting.length > 0) {
      this.waiting.shift()(item);
    } else {
      this.items.push(item);
    }
  }
}

function firstPartyApp(thirdPartyHostname, port) {
  const app = express();
  app.use(cookieParser());
  app.requests = new Channel();

  app.get('/', (req, res) => {
    app.requests.push(req);
    res.cookie(fpcookie.name, fpcookie.value);
    return res.send(
      `<script type="text/javascript" src="http://${thirdPartyHostname}:${port}/tracker.js"></script>`
    );
  });
  return app;
}

function thirdPartyApp() {
  const app = express();
  app.use(cookieParser());
  app.requests = new Channel();

  app.get('/tracker.js', (req, res) => {
    app.requests.push(req);
    res.cookie(tpcookie.name, tpcookie.value);
    return res.send('console.log("third party script")');
  });
  return app;
}

function cookieApp(app, firstPartyHostname, thirdPartyHostname, port) {
  let firstParty = firstPartyApp(thirdPartyHostname, port),
    thirdParty = thirdPartyApp();
  app.use(vhost(firstPartyHostname, firstParty));
  app.use(vhost(thirdPartyHostname, thirdParty));
  Object.assign(app, {firstParty, thirdParty, firstPartyHostname, thirdPartyHostname, port});
  return app;
}

Object.assign(module.exports, {cookieApp, fpcookie, tpcookie});
