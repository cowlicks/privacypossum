"use strict";

const {assert} = require('chai'),
  {Tabs, Tab} = require('../tabs'),
  {DomainStore} = require('../store'),
  {URL, onMessage, onUpdated} = require('../shim'),
  {Action} = require('../schemes'),
  {main_frame, third_party} = require('./testing_utils').details,
  {Reason, Reasons, reasonsArray, tabDeactivate} = require('../reasons/reasons'),
  {onUserUrlDeactivate} = require('../reasons/user_url_deactivate'),
  {PopupHandler, Handler, TabHandler} = require('../reasons/handlers');

const {TAB_DEACTIVATE, NO_ACTION, USER_HOST_DEACTIVATE, CANCEL, USER_URL_DEACTIVATE, BLOCK, FINGERPRINTING} = require('../constants');

describe('reasons.js', function() {
  beforeEach(function() {
    this.tabs = new Tabs();
    this.store = new DomainStore('name'),
    this.reasons = Reasons.fromArray(reasonsArray);
  });

  describe('user_url_deactivate', function() {
    it('saves previous action', async function() {
      const {url, tabId} = main_frame,
        {store, tabs} = this,
        firstAction = new Action('something');

      tabs.addResource(main_frame.copy());
      await this.store.setUrl(url, firstAction);

      await onUserUrlDeactivate({store, tabs}, {url, tabId});
      let action = store.getUrl(url);
      assert.equal(action.reason, USER_URL_DEACTIVATE);
      assert.deepEqual(action.getData('deactivatedAction'), firstAction);
    });
  });

  describe('Reasons', function() {
    it('#addReason', async function() {
      let reasons = Reasons.fromArray(reasonsArray),
        result = new Promise(resolve => reasons.addListener(resolve)),
        value = 'value';
      reasons.addReason(value);
      assert.equal(await result, value);
    });
  });
  describe('PopupHandler', function() {
    beforeEach(function() {
      this.popupHandler = new PopupHandler(this.reasons);
    });
    it('fingerprinting popup handler sends url deactivate', function() {
      let url = 'some url',
        expected = {type: USER_URL_DEACTIVATE, url};

      this.popupHandler.dispatcher(FINGERPRINTING, [url]);
      assert.include(onMessage.messages.pop().pop(), expected);
    });

    it('adds reasons', function() {
      let called = false, name = 'test';
      this.popupHandler.addReason({name, popupHandler: () => called = true});
      this.popupHandler.dispatcher(name);
      assert.isTrue(called);
    });

    it('#getInfo', function() {
      assert.include(this.popupHandler.getInfo(FINGERPRINTING).icon, 'fingerprinting');
      assert.include(this.popupHandler.getInfo(BLOCK).icon, 'block');
    });
  });
  describe('TabHandler', function() {
    it('handles tabs', async function() {
      let name = 'name',
        called = false; // should change to true

      let action = new Action(name),
        reason = new Reason(name, {tabHandler: ({}, {}) => called = true}),
        reasons = new Reasons();

      // setup tab
      this.tabs.addResource(main_frame);
      this.tabs.getTab(main_frame.tabId).action = action;

      // setup handler
      let th = new TabHandler(this.tabs, undefined, reasons);
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
          obj = {action: new Action(name)};

        this.handler.addReason(reason);
        this.handler.handleRequest(obj, details);
        assert.isTrue(details.assignedToDetails);
      });
    });

    it('#isInPopup', function() {
      [FINGERPRINTING, USER_URL_DEACTIVATE].forEach(name => {
        assert.isTrue(this.handler.isInPopup(name), `${name} should be in popup`);
      });
      [TAB_DEACTIVATE, USER_HOST_DEACTIVATE].forEach(name => {
        assert.isFalse(this.handler.isInPopup(name), `${name} should be in popup`);
      });
    });

    describe('#handleRequest', function() {
      it('fingerprinting', function() {
        let obj = {action: new Action(FINGERPRINTING)},
          details = third_party.copy();
        details.urlObj = new URL(details.url);
        this.tabs.addResource(main_frame.copy());

        this.handler.handleRequest(obj, details);

        assert.equal(details.response, CANCEL);
      });

      it('url deactivate', function() {
        let details = {}, obj = {};
        obj.action = new Action(USER_URL_DEACTIVATE);
        this.handler.handleRequest(obj, details);
        assert.equal(details.response, NO_ACTION);
      });

      it('host deactivate', function() {
        let tabId = 1,
          obj = {}, details = {tabId},
          tab = new Tab();

        this.tabs.setTab(tabId, tab);
        obj.action = new Action(USER_HOST_DEACTIVATE);

        this.handler.handleRequest(obj, details);

        assert.deepEqual(details.response, NO_ACTION);
        assert.isTrue(details.shortCircuit);
        assert.deepEqual(tab.action, tabDeactivate);
      });

      it('tab deactivate', function() {
        let details = {}, tab = new Tab();
        tab.action = tabDeactivate;

        this.handler.handleRequest(tab, details);
        assert.deepEqual(details.response, NO_ACTION);
        assert.isTrue(details.shortCircuit);
      });
    })
  });
});
