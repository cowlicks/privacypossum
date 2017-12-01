"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {connect, onBeforeRequest, sendMessage, URL, getBadgeText} = require('../shim'),
  {details, Details, toSender} = require('./testing_utils'),
  {Popup} = require('../popup'),
  {Possum} = require('../possum');

describe('possum.js', function() {
  beforeEach(function() {
    this.possum = new Possum();
    this.script = Object.assign({}, details.script);
    this.main_frame = Object.assign({}, details.main_frame);
  });

  describe('fingerprinting', function() {
    beforeEach(async function() {
      // load a page, with a script
      onBeforeRequest.sendMessage(this.main_frame);
      onBeforeRequest.sendMessage(this.script);

      // page see's fingerprinting and sends message
      await sendMessage(
        {type: constants.FINGERPRINTING, url: this.script.url},
        toSender(this.main_frame)
      );
    });

    describe('deactivates', function() {
      it('deactivate url', async function() {
        let details = this.script;
        // assure it is blocked
        assert.deepEqual(this.possum.webRequest.onBeforeRequest(details), constants.CANCEL);

        await sendMessage({type: constants.USER_URL_DEACTIVATE, url: details.url});

        assert.deepEqual(this.possum.webRequest.onBeforeRequest(details), constants.NO_ACTION);
      });
    });

    it('blocks fingerprinting after it is detected', function() {
      // another request for the fingerprinting script is made
      let result = this.possum.webRequest.onBeforeRequest(this.script);
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
      onBeforeRequest.sendMessage(details2);

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
      connect.sender = {tab: {id: tabId}};
      let popup = new Popup(tabId);
      await popup.connect();
      assert.isTrue(popup.blocked.has(this.script.url), 'popup has the blocked url');
    });
  });
});
