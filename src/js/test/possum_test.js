"use strict";

const assert = require('chai').assert,
  {Possum} = require('../possum');

describe('possum.js', function() {
  it('constructs', function() {
    let possum = new Possum();
    assert.ok(possum);
  });
});
