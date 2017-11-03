"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {onBeforeRequest, sendMessage} = require('../shim'),
  {details} = require('./testing_utils'),
  {Possum} = require('../possum');

describe('possum.js', function() {
  it('constructs', async function() {
    let possum = new Possum();

    // load a page, with a script
    onBeforeRequest.sendMessage(details.main_frame);
    onBeforeRequest.sendMessage(details.script);

    // page see's fingerprinting and sends message
    await sendMessage(
      {type: constants.FINGERPRINTING, url: details.script.url},
      details.main_frame.toSender()
    );

    // another request for the fingerprinting script is made
    let result = possum.webRequest.onBeforeRequest(details.script);
    assert.deepEqual(result, constants.CANCEL);
  });
});
