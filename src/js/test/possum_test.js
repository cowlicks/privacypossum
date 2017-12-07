"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {Reason} = require('../reasons'),
  {Action} = require('../schemes'),
  {connect, sendMessage, URL, getBadgeText, tabsQuery} = require('../shim'),
  {details, Details, toSender} = require('./testing_utils'),
  {Popup} = require('../popup'),
  {Possum} = require('../possum');

describe('possum.js', function() {
  beforeEach(function() {
    this.possum = new Possum();
    this.onBeforeRequest = this.possum.webRequest.onBeforeRequest.bind(this.possum.webRequest);
    this.script = Object.assign({}, details.script);
    this.main_frame = Object.assign({}, details.main_frame);
  });

  describe('user deactivates', function() {
    beforeEach(async function() {
      let blocker = new Reason('block', {requestHandler: ({}, d) => d.response = constants.CANCEL});

      this.possum.webRequest.handler.addReason(blocker);
      await this.possum.store.setDomainPath(
        this.script.url,
        new Action({reason: blocker.name, href: this.script.url})
      );
    });
    it('unblocked urls', async function() {
      let details = this.script;
      // assure it is blocked
      assert.deepEqual(this.onBeforeRequest(details), constants.CANCEL);

      await sendMessage({type: constants.USER_URL_DEACTIVATE, url: details.url});

      assert.deepEqual(this.onBeforeRequest(details), constants.NO_ACTION);
    });

    it('unblocks urls on deactivated hosts', async function() {
      await sendMessage({type: constants.USER_HOST_DEACTIVATE, url: this.main_frame.url});

      let host_result = this.onBeforeRequest(this.main_frame);
      assert.deepEqual(host_result, constants.NO_ACTION);

      let script_result = this.onBeforeRequest(this.script);
      assert.deepEqual(script_result, constants.NO_ACTION);
    });
  });

  describe('fingerprinting', function() {
    beforeEach(async function() {
      // load a page, with a script
      this.onBeforeRequest(this.main_frame);
      this.onBeforeRequest(this.script);

      // page see's fingerprinting and sends message
      await sendMessage(
        {type: constants.FINGERPRINTING, url: this.script.url},
        toSender(this.main_frame)
      );
    });

    it('blocks fingerprinting after it is detected', function() {
      // another request for the fingerprinting script is made
      let result = this.onBeforeRequest(this.script);
      assert.deepEqual(result, constants.CANCEL);
      getBadgeText({tabId: this.script.tabId}, (text) => assert.equal(text, '1'));
    });

    it('still blocks fingerprinting after loading from disk', async function() {
      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      let result = possum2.webRequest.onBeforeRequest(this.script);
      assert.deepEqual(result, constants.CANCEL);
    });

    it('loads 2 blocked paths', async function() {
      let url2 = new URL(this.script.url);
      url2.pathname = '/otherpath.js';

      let details2 = new Details(Object.assign({}, this.script, {url: url2.href}))
      this.onBeforeRequest(details2);

      await sendMessage(
        {type: constants.FINGERPRINTING, url: details2.url},
        toSender(this.main_frame)
      );

      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      let result = possum2.webRequest.onBeforeRequest(this.script),
        result2 =  possum2.webRequest.onBeforeRequest(details2);
      assert.deepEqual(result, constants.CANCEL);
      assert.deepEqual(result2, constants.CANCEL);
      getBadgeText({tabId: details2.tabId}, (text) => assert.equal(text, '2'));
    })

    it('has the fp script blocked in the popup', async function() {
      let tabId = this.script.tabId;
      tabsQuery.tabs = [{id: tabId}];
      let popup = new Popup(tabId);
      await popup.connect();
      assert.isTrue(popup.blocked.has(this.script.url), 'popup has the blocked url');
    });
  });
});
