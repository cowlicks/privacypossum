"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {onBeforeRequest, sendMessage} = require('../shim'),
  {details} = require('./testing_utils'),
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
    });

    it('still blocks fingerprinting after loading from disk', async function() {
      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      let result = possum2.webRequest.onBeforeRequest(details.script);
      assert.deepEqual(result, constants.CANCEL);
    });
  });
});
