"use strict";

const {assert} = require('chai'),
  {getOnBeforeRequestOptions, getOnBeforeSendHeadersOptions, getOnHeadersReceivedOptions} = require('../browser_compat');

describe('browser_compat.js', function() {
  it("gets options", function () {
    assert.deepEqual(getOnBeforeRequestOptions(), ['blocking'])
    assert.deepEqual(getOnBeforeSendHeadersOptions(), ['blocking', 'requestHeaders'])
    assert.deepEqual(getOnHeadersReceivedOptions(), ['blocking', 'responseHeaders'])
  });
});
