"use strict";

const {assert} = require('chai'),
  {Tabs, Tab} = require('../tabs'),
  constants = require('../constants'),
  {Action} = require('../schemes'),
  {Handler, tabDeactivate} = require('../reasons');

describe('reasons.js', function() {
  beforeEach(function() {
    this.tabs = new Tabs();
    this.handler = new Handler(this.tabs);
  });

  describe('#handleRequest', function() {
    it('fingerprinting', function() {
      let details = {}, obj = {};
      obj.action = new Action({reason: constants.FINGERPRINTING});
      this.handler.handleRequest(obj, details);
      assert.equal(details.response, constants.CANCEL);
    });

    it('url deactivate', function() {
      let details = {}, obj = {};
      obj.action = new Action({reason: constants.USER_URL_DEACTIVATE});
      this.handler.handleRequest(obj, details);
      assert.equal(details.response, constants.NO_ACTION);
    });

    it('host deactivate', function() {
      let tabId = 1,
        obj = {}, details = {tabId},
        tab = new Tab();

      this.tabs.setTab(tabId, tab);
      obj.action = new Action({reason: constants.USER_HOST_DEACTIVATE});

      this.handler.handleRequest(obj, details);

      assert.deepEqual(details.response, constants.NO_ACTION);
      assert.isTrue(details.shortCircuit);
      assert.deepEqual(tab.action, tabDeactivate);
    });

    it('tab deactivate', function() {
      let details = {}, tab = new Tab();
      tab.action = tabDeactivate;

      this.handler.handleRequest(tab, details);
      assert.deepEqual(details.response, constants.NO_ACTION);
      assert.isTrue(details.shortCircuit);
    });
  })
});
