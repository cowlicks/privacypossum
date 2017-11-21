"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {onBeforeRequest, sendMessage, URL, getBadgeText} = require('../shim'),
  {details, Details} = require('./testing_utils'),
  {Possum} = require('../possum');

describe('possum.js', function() {
  describe('fingerprinting', function() {
    beforeEach(async function() {
      this.possum = new Possum();

      // load a page, with a script
      onBeforeRequest.sendMessage(details.main_frame);
      onBeforeRequest.sendMessage(details.script);

      // page see's fingerprinting and sends message
      await sendMessage(
        {type: constants.FINGERPRINTING, url: details.script.url},
        details.main_frame.toSender()
      );
    });

    it('blocks fingerprinting after it is detected', function() {
      // another request for the fingerprinting script is made
      let result = this.possum.webRequest.onBeforeRequest(details.script);
      assert.deepEqual(result, constants.CANCEL);
      getBadgeText({tabId: details.script.tabId}, (text) => assert.equal(text, '1'));
    });

    it('still blocks fingerprinting after loading from disk', async function() {
      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      let result = possum2.webRequest.onBeforeRequest(details.script);
      assert.deepEqual(result, constants.CANCEL);
    });

    it('loads 2 blocked paths', async function() {
      let url2 = new URL(details.script.url);
      url2.pathname = '/otherpath.js';

      let details2 = new Details(Object.assign({}, details.script, {url: url2.href}))
      onBeforeRequest.sendMessage(details2);

      await sendMessage(
        {type: constants.FINGERPRINTING, url: details2.url},
        details.main_frame.toSender()
      );

      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      let result = possum2.webRequest.onBeforeRequest(details.script),
        result2 =  possum2.webRequest.onBeforeRequest(details2);
      assert.deepEqual(result, constants.CANCEL);
      assert.deepEqual(result2, constants.CANCEL);
      getBadgeText({tabId: details2.tabId}, (text) => assert.equal(text, '2'));
    })

  });
});
