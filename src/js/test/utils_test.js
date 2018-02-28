'use strict';

const assert = require('chai').assert,
  {fakePort} = require('../fakes'),
  {View, Model, Listener} = require('../utils'),
  {LogBook, wrap, zip} = require('../utils');

describe('utils.js', function() {
  describe('View and Model', function() {
    it('they can talk', async function() {
      let [aPort, bPort] = fakePort('test'),
        result,
        data = new Listener();

      data.getData = () => data.x;
      data.x = 'initial';

      let view = new View(aPort, out => result = out);
      new Model(bPort, data),

      assert.equal(result, 'initial');

      data.x = 'new data';
      data.onChange();

      assert.equal(result, 'new data');

      await view.disconnect();

      data.x = 'should not change to this';
      data.onChange();

      assert.equal(result, 'new data');
    });
  });

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
