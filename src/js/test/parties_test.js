"use strict";

const assert = require('chai').assert,
  {isThirdParty} = require('../domains/parties');

describe('parties.js', function() {
  it('false cases', function() {
    assert.isFalse(isThirdParty('reddit.com', 'redditstatic.com'));
    assert.isFalse(isThirdParty('github.com', 'avatars2.githubusercontent.com'));
  });
});
