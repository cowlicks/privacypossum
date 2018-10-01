'use strict';

const {assert} = require('chai');

const sw = require('selenium-webdriver'),
  express = require('express'),
  {createServer} = require('http'),
  {cookieApp, fpcookie, tpcookie} = require("./cookies");

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
    '--load-extension='+extPath,
    '--no-sandbox',
  ]});
  return new sw.Builder()
      .forBrowser('chrome')
      .withCapabilities(chromeOptions)
      .build();
}

describe('selenium test', function() {
  beforeEach(function() {
    // we need to only use xvfb when asked
    this.i = 0;
    console.log(`at number: ${this.i}`);
    this.i += 1;
    this.app = cookieApp(module.exports = express(), firstPartyHostname, thirdPartyHostname, PORT);
    console.log(`at number: ${this.i}`);
    this.i += 1;
    this.driver = loadDriverWithExtension(path);
    console.log(`at number: ${this.i}`);
    this.i += 1;
    startApp(this.app);
    console.log(`at number: ${this.i}`);
    this.i += 1;
  });
  afterEach(function() {
    stopApp(this.app);
    this.driver.quit();
  });

  it('blocks cookies', async function() {
    let {app, driver} = this;
    console.log(`at number: ${this.i}`);
    this.i += 1;
    driver.get(firstPartyHost);
    console.log(`at number: ${this.i}`);
    this.i += 1;
    let request = await app.firstParty.requests.next();
    console.log(`at number: ${this.i}`);
    this.i += 1;
    // no cookies initially
    assert.deepEqual(request.cookies, {});
    console.log(`at number: ${this.i}`);
    this.i += 1;
    request = await app.thirdParty.requests.next();
    console.log(`at number: ${this.i}`);
    this.i += 1;
    assert.deepEqual(request.cookies, {});
    console.log(`at number: ${this.i}`);
    this.i += 1;

    driver.get(firstPartyHost);
    console.log(`at number: ${this.i}`);
    this.i += 1;
    request = await app.firstParty.requests.next();
    console.log(`at number: ${this.i}`);
    this.i += 1;
    // now we have first party cookies set
    assert.deepEqual(request.cookies, {[fpcookie.name]: fpcookie.value});
    console.log(`at number: ${this.i}`);
    this.i += 1;
    request = await app.thirdParty.requests.next();
    console.log(`at number: ${this.i}`);
    this.i += 1;
    // but not third party cookies
    assert.deepEqual(request.cookies, {});
    console.log(`at number: ${this.i}`);
    this.i += 1;
  });
});
