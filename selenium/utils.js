'use strict';

const sw = require('selenium-webdriver'),
  {createServer} = require('http');

function startApp(app, port=PORT) {
  app.server = createServer(app);
  app.server.listen(port);
}

const path = '../src/.',
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

function loadDriverWithExtension(extPath) {
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

function newDriver() {
  return loadDriverWithExtension(path);
}

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

function requestRecorderApp(app = express()) {
  app.requests = new Channel();
  app.use((req, res, next) => {
    app.requests.push(req);
    next();
  });
  return app;
}


Object.assign(module.exports, {newDriver, startApp, stopApp, PORT, firstPartyHostname, thirdPartyHostname, firstPartyHost, thirdPartyHost, Channel, requestRecorderApp});
