"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {Reason} = require('../reasons/reasons'),
  {Action} = require('../schemes'),
  {onConnect, tabsOnMessage, onMessage, sendMessage, URL, getBadgeText, tabsQuery} = require('../shim'),
  {cookie, notCookie, details, Details, toSender} = require('./testing_utils'),
  {Popup} = require('../popup'),
  {Possum} = require('../possum');

let {script, main_frame, first_party_script} = details,
  reqHeaders = new Details(Object.assign(script.copy(), {requestHeaders: [cookie, notCookie]})),
  respHeaders = new Details(Object.assign(script.copy(), {responseHeaders: [cookie, notCookie]}));

describe('possum.js', function() {
  beforeEach(function() {
    tabsOnMessage.clear();
    onMessage.clear();
    onConnect.clear();
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

      // set tab
      this.onBeforeRequest(main_frame.copy());
    });
    it('ensure we block block it & strip cookies', function() {
      assert.deepEqual(this.onBeforeRequest(script.copy()), constants.CANCEL);
      // assure it strips cookies
      assert.deepEqual(this.onBeforeSendHeaders(reqHeaders.copy()), {'requestHeaders': [notCookie]});
      assert.deepEqual(this.onHeadersReceived(respHeaders.copy()), {'responseHeaders': [notCookie]});
    });

    describe('unblocked urls', function() {
      beforeEach(async function() {
        await sendMessage({type: constants.USER_URL_DEACTIVATE, url: script.copy().url});
      });

      it('unblocks requests', function() {
        // assure it is blocked
        assert.deepEqual(this.onBeforeRequest(script.copy()), constants.NO_ACTION);
      });

      it('does not strip cookies when the url is a 3rd party', function() {
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders.copy()), constants.NO_ACTION);
        assert.deepEqual(this.onHeadersReceived(reqHeaders.copy()), constants.NO_ACTION);
      });
    });

    describe('deactivated hosts', async function() {
      let tabId = details.main_frame.tabId;
      beforeEach(async function() {
        this.onBeforeRequest(main_frame.copy());

        // deactivate tab
        await sendMessage({type: constants.USER_HOST_DEACTIVATE, tabId});
      });

      it('does not block on this tab', async function() {
        // not blocked on this tab
        let script_result = this.onBeforeRequest(script.copy());
        assert.deepEqual(script_result, constants.NO_ACTION);

        // re-activate tab
        await sendMessage({type: constants.USER_HOST_DEACTIVATE, tabId});

        // blocked again
        assert.deepEqual(this.onBeforeRequest(script.copy()), constants.CANCEL);
      });

      it('does not strip headers', async function() {
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders.copy()), constants.NO_ACTION);
        assert.deepEqual(this.onHeadersReceived(reqHeaders.copy()), constants.NO_ACTION);

        // re-activate tab
        await sendMessage({type: constants.USER_HOST_DEACTIVATE, tabId});

        // assure it strips cookies again
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders.copy()), {'requestHeaders': [notCookie]});
        assert.deepEqual(this.onHeadersReceived(respHeaders.copy()), {'responseHeaders': [notCookie]});
      });
    });
  });

  describe('fingerprinting', function() {
    beforeEach(async function() {
      // load a page, with a script
      this.onBeforeRequest(main_frame.copy());
      this.onBeforeRequest(script.copy());
      this.onBeforeRequest(first_party_script.copy());

      // page see's fingerprinting and sends message
      await sendMessage(
        {type: constants.FINGERPRINTING, url: details.script.url},
        toSender(main_frame.copy())
      );
    });

    describe('first party fingerprinting', function() {
      beforeEach(async function() {
        await sendMessage(
          {type: constants.FINGERPRINTING, url: details.first_party_script.url},
          toSender(main_frame.copy())
        );
      });

      it('does not block firstparty fingerprinting scripts', function() {
        let result = this.onBeforeRequest(first_party_script.copy());
        assert.deepEqual(result, constants.NO_ACTION);
      })

      it('alerts the page script', function() {
        let fps = first_party_script.copy(),
          {tabId, frameId} = fps;

        this.onBeforeRequest(fps);
        let message = tabsOnMessage.messages[tabsOnMessage.messages.length - 1];
        assert.deepEqual(message, [
            tabId,
            {type: 'firstparty-fingerprinting', url: first_party_script.url},
            {frameId},
        ]);
      })
    });

    it('blocks fingerprinting after it is detected', function() {
      // another request for the fingerprinting script is made
      let result = this.onBeforeRequest(script.copy());
      assert.deepEqual(result, constants.CANCEL);
      getBadgeText({tabId: details.script.tabId}, (text) => assert.equal(text, '1'));
    });

    it('still blocks fingerprinting after loading from disk', async function() {
      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      possum2.webRequest.onBeforeRequest(main_frame.copy());
      let result = possum2.webRequest.onBeforeRequest(script.copy());
      assert.deepEqual(result, constants.CANCEL);
    });

    it('loads 2 blocked paths', async function() {
      let url2 = new URL(details.script.url);
      url2.pathname = '/otherpath.js';

      let details2 = new Details(Object.assign(script.copy(), {url: url2.href}))
      this.onBeforeRequest(details2);

      await sendMessage(
        {type: constants.FINGERPRINTING, url: details2.url},
        toSender(main_frame.copy())
      );

      let possum2 = await Possum.load(this.possum.store.diskMap.disk);
      possum2.webRequest.onBeforeRequest(main_frame.copy());

      let result = possum2.webRequest.onBeforeRequest(script.copy()),
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
