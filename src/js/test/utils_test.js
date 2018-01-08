'use strict';

const assert = require('chai').assert,
  {LogBook, wrap, zip} = require('../utils');

describe('utils.js', function() {
  it('wraps', function() {
    let splitter = (string) => string.split(''),
      after = (s) => s.join(''),
      before = (s) => ['[' + s + ']'];
    let func = wrap(splitter, before, after);
    assert.equal(func('abc'), '[abc]');
  });

  it('zip', function() {
    let a = 'abcd'.split(''),
      b = 'efgh'.split(''),
      expected = 'ae bf cg dh'.split(' ').map(x => x.split(''));

    let result = zip(a, b);
    assert.deepEqual(result, expected);
    // recombine
    assert.deepEqual(zip(...result), [a, b])
  });
  it('logger', function() {
    let l = new LogBook(2);
    l.log('a');
    assert.deepEqual([[0, 'a']], l.dump());
    l.log('b').log('c');
    // strips entries over maxSize, and returns ordered by most recent
    assert.deepEqual([[2, 'c'], [1, 'b']], l.dump());
  });
})
