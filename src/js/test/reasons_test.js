"use strict";

const {assert} = require('chai'),
  {Tabs, Tab} = require('../tabs'),
  {URL, onMessage, onUpdated} = require('../shim'),
  constants = require('../constants'),
  {Action} = require('../schemes'),
  {main_frame, third_party} = require('./testing_utils').details,
  {Reason, tabDeactivate} = require('../reasons/reasons'),
  {PopupHandler, Handler, TabHandler} = require('../reasons/handlers');

describe('reasons.js', function() {
  beforeEach(function() {
    this.tabs = new Tabs();
  });
  describe('PopupHandler', function() {
    beforeEach(function() {
      this.popupHandler = new PopupHandler();
    });
    it('fingerprinting popup handler sends url deactivate', function() {
      let url = 'some url',
        expected = {type: constants.USER_URL_DEACTIVATE, url};

      this.popupHandler.dispatcher(constants.FINGERPRINTING, [url]);
      assert.include(onMessage.messages.pop().pop(), expected);
    });

    it('adds reasons', function() {
      let called = false, name = 'test';
      this.popupHandler.addReason({name, popupHandler: () => called = true});
      this.popupHandler.dispatcher(name);
      assert.isTrue(called);
    });
  });
  describe('TabHandler', function() {
    it('handles tabs', async function() {
      let name = 'name',
        called = false; // should change to true

      let action = new Action({reason: name}),
        reason = new Reason(name, {tabHandler: ({}, {}) => called = true});

      // setup tab
      this.tabs.addResource(main_frame);
      this.tabs.getTab(main_frame.tabId).action = action;

      // setup handler
      let th = new TabHandler(this.tabs, undefined);
      th.addReason(reason);
      th.startListeners();

      await onUpdated.sendMessage(main_frame.tabId, {});
      assert.isTrue(called);
    });
  });
  describe('Handler', function() {
    beforeEach(function() {
      this.handler = new Handler(this.tabs);
    });

    describe('#addReason', function() {
      it('handler can add reasons and use them', function() {
        let details = {},
          name = 'block',
          assignedToDetails = true,
          requestHandler = ({}, details) => Object.assign(details, {assignedToDetails}),
          reason = new Reason(name, {requestHandler}),
          obj = {action: new Action({reason: name})};

        this.handler.addReason(reason);
        this.handler.handleRequest(obj, details);
        assert.isTrue(details.assignedToDetails);
      });
    });

    it('#isInPopup', function() {
      [constants.FINGERPRINTING, constants.USER_URL_DEACTIVATE].forEach(name => {
        assert.isTrue(this.handler.isInPopup(name), `${name} should be in popup`);
      });
      [constants.TAB_DEACTIVATE, constants.USER_HOST_DEACTIVATE].forEach(name => {
        assert.isFalse(this.handler.isInPopup(name), `${name} should be in popup`);
      });
    });

    describe('#handleRequest', function() {
      it('fingerprinting', function() {
        let obj = {action: new Action({reason: constants.FINGERPRINTING})},
          details = third_party.copy();
        details.urlObj = new URL(details.url);
        this.tabs.addResource(main_frame.copy());

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
});
