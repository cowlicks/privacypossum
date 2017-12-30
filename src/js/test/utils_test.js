'use strict';

const assert = require('chai').assert,
  {LogBook} = require('../utils');

describe('utils.js', function() {
  it('constructs', function() {
    let l = new LogBook(2);
    l.log('a');
    assert.deepEqual([[0, 'a']], l.dump());
    l.log('b').log('c');
    // strips entries over maxSize, and returns ordered by most recent
    assert.deepEqual([[2, 'c'], [1, 'b']], l.dump());
  });
})
