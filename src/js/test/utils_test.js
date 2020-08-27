import chai from 'chai'; const {assert} = chai;
import {fakePort} from '../fakes.js';
import {View, Model, Listener, Counter, LruMap, LogBook, wrap, zip} from '../utils.js';

describe('utils.js', function() {
  describe('LruMap', function() {
    let maxSize = 3;
    beforeEach(function() {
      this.lrumap = new LruMap(maxSize);
      this.lrumap.set(1, 11).set(2, 22);
    });
    it('does not get bigger than max size', function() {
      this.lrumap.set(3, 33).set(4, 44);
      assert.equal(this.lrumap.size, maxSize);
      assert.isFalse(this.lrumap.has(1));
    });
    it('.has reorders cache', function() {
      assert.isTrue(this.lrumap.has(1)); // move 1 ahead of 2
      this.lrumap.set(3, 33).set(4, 44);
      assert.equal(this.lrumap.size, maxSize);
      assert.isFalse(this.lrumap.has(2));  // 2 was purged
    });
    it('.get reorders cache', function() {
      assert.equal(this.lrumap.get(1), 11); // move 1 ahead of 2
      this.lrumap.set(3, 33).set(4, 44);
      assert.equal(this.lrumap.size, maxSize);
      assert.isUndefined(this.lrumap.get(2), 22);  // 2 was purged
    });
  });
  describe('Counter', function() {
    beforeEach(function() {
      this.counter = new Counter();
      [1, 2, 2, 3, 3, 3].forEach(x => this.counter.add(x));
    });
    it('adds', function() {
      assert.deepEqual(Array.from(this.counter), [[1, 1], [2, 2], [3, 3]]);
    });
    it('merges', function() {
      let c2 = new Counter();
      c2.add(1);
      c2.add(4);
      this.counter.merge(c2);
      assert.deepEqual(Array.from(this.counter), [[1, 2], [2, 2], [3, 3], [4, 1]]);
    });
  });
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
    l.log('b')
    l.log('c');
    // strips entries over maxSize, and returns ordered by most recent
    assert.deepEqual([[2, 'c'], [1, 'b']], l.dump());
  });
})
