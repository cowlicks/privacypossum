"use strict";

const assert = require('chai').assert,
  {MultiDomainFirstParties} = require('../mdfp');

describe('mdfp.js', function() {
  beforeEach(function() {
    this.mdfp = new MultiDomainFirstParties();
  });

  it('true cases', function() {
    assert.isTrue(this.mdfp.isMdfp('reddit.com', 'redditstatic.com'));
    assert.isTrue(this.mdfp.isMdfp('reddit.com', 'reddit.com'));
    assert.isTrue(this.mdfp.isMdfp('notonlist.com', 'notonlist.com'));
  })

  it('false cases', function() {
    assert.isFalse(this.mdfp.isMdfp('reddit.com', 'railnation.de'));
    assert.isFalse(this.mdfp.isMdfp('notonlist.com', 'othernotonlist.com'));
  });
});
