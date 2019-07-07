'use strict';

const sw = require('selenium-webdriver'),
  {createServer} = require('http'),
  path = require('path'),
  vhost = require('vhost'),
  express = require('express');

function startApp(app, port=PORT) {
  app.server = createServer(app);
  app.server.listen(port);
}

const srcDir = '../src/.',
  PORT = 8000,
  host = (hostname, port) => `${hostname}:${port}`,
  firstPartyHostname = 'firstparty.local',
  thirdPartyHostname = 'thirdparty.local',
  firstPartyHost = host(firstPartyHostname, PORT),
  thirdPartyHost = host(thirdPartyHostname, PORT);

function startApp(app, port=PORT) {
  app.server = createServer(app);
  app.server.listen(port);
}

function stopApp(app) {
  app.server.close();
}

/*
 * in /etc/hosts this requires:
 * 127.0.0.1    firstparty.local
 * 127.0.0.1    thirdparty.local
 */

async function loadDriverWithExtension(extPath) {
  let chromeOptions = sw.Capabilities.chrome();
  chromeOptions.set("chromeOptions",  {"args": [
    `--load-extension=${extPath}`,
    '--no-sandbox',
  ]});
  return new sw.Builder()
      .forBrowser('chrome')
      .withCapabilities(chromeOptions)
      .build();
}

async function newDriver() {
  const srcPath = path.resolve(__dirname, srcDir);
  return await loadDriverWithExtension(srcPath);
}

class Channel {
  // async stack datastructure
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

  // Get the item from the top of the stack, or wait for an item if there are none.
  async next() {
    return await this.popQueue();
  }

  // Push an item onto the stack.
  push(item) {
    if (this.waiting.length > 0) {
      this.waiting.pop()(item);
    } else {
      this.items.push(item);
    }
  }
}

function requestRecorderMiddleware(app = express()) {
  app.requests = new Channel();
  app.responses = new Channel();
  app.use((req, res, next) => {
    app.requests.push(req);
    app.responses.push(res);
    next();
  });
  return app;
}

function firstPartyApp(app = express(), tpHost = thirdPartyHost) {
  app.get('*', (req, res) => {
    return res.send(
      `<script type="text/javascript" src="http://${tpHost}/tracker.js"></script>`
    );
  });
  return app;
}

function thirdPartyApp(app = express()) {
  app.get('*', (req, res) => {
    return res.send('console.log("third party script")');
  });
  return app;
}


function baseTestApp(fpApp, tpApp, app = express(), fpHostname = firstPartyHostname, tpHostname = thirdPartyHostname) {
  let firstParty = firstPartyApp(fpApp),
    thirdParty = thirdPartyApp(tpApp);
  app.all('/', vhost(fpHostname, firstParty));
  app.all('/tracker.js', vhost(tpHostname, thirdParty));
  Object.assign(app, {firstParty, thirdParty});
  return app;
}

Object.assign(module.exports, {newDriver, startApp, stopApp, PORT, firstPartyHostname, thirdPartyHostname, firstPartyHost, thirdPartyHost, Channel, requestRecorderMiddleware, firstPartyApp, thirdPartyApp, baseTestApp});
