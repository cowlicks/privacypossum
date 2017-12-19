"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {Reason} = require('../reasons'),
  {Action} = require('../schemes'),
  {onMessage, sendMessage, URL, getBadgeText, tabsQuery} = require('../shim'),
  {cookie, notCookie, details, Details, toSender} = require('./testing_utils'),
  {Popup} = require('../popup'),
  {Possum} = require('../possum');

let newScript = () => Object.assign({}, details.script),
  newMain = () => Object.assign({}, details.main_frame),
  reqHeaders = () => Object.assign({}, newScript(), {'requestHeaders': [cookie, notCookie]}),
  respHeaders = () => Object.assign({}, newScript(), {'responseHeaders': [cookie, notCookie]});

describe('possum.js', function() {
  beforeEach(function() {
    onMessage.clear();
    this.possum = new Possum();
    this.onBeforeRequest = this.possum.webRequest.onBeforeRequest.bind(this.possum.webRequest);
    this.onBeforeSendHeaders = this.possum.webRequest.onBeforeSendHeaders.bind(this.possum.webRequest);
    this.onHeadersReceived = this.possum.webRequest.onHeadersReceived.bind(this.possum.webRequest);
  });

  describe('user deactivates', function() {
    beforeEach(async function() {
      let blocker = new Reason('block', {requestHandler: ({}, d) => d.response = constants.CANCEL});

      this.possum.webRequest.handler.addReason(blocker);
      await this.possum.store.setDomainPath(
        details.script.url,
        new Action({reason: blocker.name, href: details.script.url})
      );
    });
    it('ensure we have a blocked stuff', function() {
      // set tab
      this.onBeforeRequest(newMain());
      assert.deepEqual(this.onBeforeRequest(newScript()), constants.CANCEL);
      // assure it strips cookies
      assert.deepEqual(this.onBeforeSendHeaders(reqHeaders()), {'requestHeaders': [notCookie]});
      assert.deepEqual(this.onHeadersReceived(respHeaders()), {'responseHeaders': [notCookie]});
    });

    describe('unblocked urls', async function() {
      beforeEach(async function() {
        await sendMessage({type: constants.USER_URL_DEACTIVATE, url: newScript().url});
      });

      it('unblocks requests', async function() {
        // assure it is blocked
        assert.deepEqual(this.onBeforeRequest(newScript()), constants.NO_ACTION);
      });

      it('does not strip third party headers', async function() {
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders()), constants.NO_ACTION);
        assert.deepEqual(this.onHeadersReceived(reqHeaders()), constants.NO_ACTION);
      });
    });

    describe('deactivated hosts', async function() {
      let tabId = details.main_frame.tabId;
      beforeEach(async function() {
        this.onBeforeRequest(newMain());

        // deactivate tab
        await sendMessage({type: constants.USER_HOST_DEACTIVATE, tabId});
      });

      it('does not block on this tab', async function() {
        // not blocked on this tab
        let script_result = this.onBeforeRequest(newScript());
        assert.deepEqual(script_result, constants.NO_ACTION);

        // re-activate tab
        await sendMessage({type: constants.USER_HOST_DEACTIVATE, tabId});

        // blocked again
        assert.deepEqual(this.onBeforeRequest(newScript()), constants.CANCEL);
      });

      it('does not strip headers', async function() {
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders()), constants.NO_ACTION);
        assert.deepEqual(this.onHeadersReceived(reqHeaders()), constants.NO_ACTION);

        // re-activate tab
        await sendMessage({type: constants.USER_HOST_DEACTIVATE, tabId});

        // assure it strips cookies again
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders()), {'requestHeaders': [notCookie]});
        assert.deepEqual(this.onHeadersReceived(respHeaders()), {'responseHeaders': [notCookie]});
      });
    });
  });

  describe('fingerprinting', function() {
    beforeEach(async function() {
      // load a page, with a script
      this.onBeforeRequest(newMain());
      this.onBeforeRequest(newScript());

      // page see's fingerprinting and sends message
      await sendMessage(
        {type: constants.FINGERPRINTING, url: details.script.url},
        toSender(newMain())
      );
    });

    it('blocks fingerprinting after it is detected', function() {
      // another request for the fingerprinting script is made
      let result = this.onBeforeRequest(newScript());
      assert.deepEqual(result, constants.CANCEL);
      getBadgeText({tabId: details.script.tabId}, (text) => assert.equal(text, '1'));
    });

    it('still blocks fingerprinting after loading from disk', async function() {
      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      let result = possum2.webRequest.onBeforeRequest(newScript());
      assert.deepEqual(result, constants.CANCEL);
    });

    it('loads 2 blocked paths', async function() {
      let url2 = new URL(details.script.url);
      url2.pathname = '/otherpath.js';

      let details2 = new Details(Object.assign({}, newScript(), {url: url2.href}))
      this.onBeforeRequest(details2);

      await sendMessage(
        {type: constants.FINGERPRINTING, url: details2.url},
        toSender(newMain())
      );

      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      let result = possum2.webRequest.onBeforeRequest(newScript()),
        result2 =  possum2.webRequest.onBeforeRequest(details2);
      assert.deepEqual(result, constants.CANCEL);
      assert.deepEqual(result2, constants.CANCEL);
      getBadgeText({tabId: details2.tabId}, (text) => assert.equal(text, '2'));
    })

    it('has the fp script blocked in the popup', async function() {
      let tabId = details.script.tabId;
      tabsQuery.tabs = [{id: tabId}];
      let popup = new Popup(tabId);
      await popup.connect();
      assert.isTrue(popup.blocked.has(details.script.url), 'popup has the blocked url');
    });
  });
});
