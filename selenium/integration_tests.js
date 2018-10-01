'use strict';

const {assert} = require('chai');

const {newDriver, startApp, stopApp, firstPartyHost} = require('./utils'),
  {cookieApp, fpcookie} = require("./cookies");

describe('cookie tests', function() {
  beforeEach(function() {
    this.app = cookieApp();
    this.driver = newDriver();
    startApp(this.app);
  });
  afterEach(function() {
    stopApp(this.app);
    this.driver.quit();
  });

  it('blocks cookies', async function() {
    let {app, driver} = this;
    driver.get(firstPartyHost);
    let request = await app.firstParty.requests.next();
    // no cookies initially
    assert.deepEqual(request.cookies, {});
    request = await app.thirdParty.requests.next();
    assert.deepEqual(request.cookies, {});

    driver.get(firstPartyHost);
    request = await app.firstParty.requests.next();
    // now we have first party cookies set
    assert.deepEqual(request.cookies, {[fpcookie.name]: fpcookie.value});
    request = await app.thirdParty.requests.next();
    // but not third party cookies
    assert.deepEqual(request.cookies, {});
  });
});
