'use strict';

const {assert} = require('chai');

const {newDriver, startApp, stopApp, firstPartyHost} = require('./utils'),
  {cookieApp, fpcookie} = require("./cookies"),
  {etagApp} = require('./etags');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

beforeEach(async function() {
  this.driver = await newDriver();
  await sleep(250);
});

afterEach(async function() {
  await this.driver.quit();
});

describe('etag tests', function() {
  beforeEach(async function() {
    this.app = etagApp();
    startApp(this.app);
  });
  afterEach(function() {
    stopApp(this.app);
  });
  it('blocks etags', async function() {
    let {app, driver} = this;
    await driver.get(firstPartyHost);  // etag gets set
    await driver.get(firstPartyHost);  // browser sends if-none-match to check if etag still valid
    let req = await app.firstParty.requests.next();
    //let req3 = await app.thirdParty.requests.next();
    assert.isTrue(req.headers.hasOwnProperty('if-none-match'), 'allows 1st party etags on first visit');
    // known failure on chrome due to lack of access to caching headers in chrome webrquest api
    //assert.isFalse(req3.headers.hasOwnProperty('if-none-match'), 'blocks 3rd party etags headers on first visit');
  });
});

describe('cookie tests', function() {
  beforeEach(async function() {
    this.app = cookieApp();
    startApp(this.app);
  });
  afterEach(function() {
    stopApp(this.app);
  });

  it('blocks cookies', async function() {
    let {app, driver} = this;

    await driver.get(firstPartyHost);
    let request = await app.firstParty.requests.next();
    // no cookies initially
    assert.deepEqual(request.cookies, {});
    request = await app.thirdParty.requests.next();
    assert.deepEqual(request.cookies, {});

    await driver.get(firstPartyHost);
    request = await app.firstParty.requests.next();
    // now we have first party cookies set
    assert.deepEqual(request.cookies, {[fpcookie.name]: fpcookie.value});
    request = await app.thirdParty.requests.next();
    // but not third party cookies
    assert.deepEqual(request.cookies, {});
  });
});
