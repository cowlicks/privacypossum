import chai from 'chai';
import {Tree, splitter} from '../suffixtree.js';

const {assert} = chai;

describe('suffixtree.js', function() {
  let host = 'bar.foo.example.com',
    parts = host.split('.'),
    len = parts.length;

  beforeEach(function() {
    this.tree = new Tree(splitter);
  });

  it('get and set', function() {
    let {tree} = this;
    for (let i = 2; i <= len; i++) {
      let name = parts.slice(-i).join('.');

      tree.set(name, i);

      assert.equal(tree.get(name), i);
    }

  });

  describe('#aggregate', function() {
    it('gathers along a path', function() {
      let expected = new Map(),
        {tree} = this;
      for (let i = 2; i <= len; i++) {
        let n = parts.slice(-i).join('.');

        tree.set(n, i);

        expected.set(n.split('.').shift(), i);
      }

      let result = tree.getBranchData(host);
      assert.deepEqual(result, expected);
      expected.forEach(key => assert.equal(result.get(key), expected.get(key)));
    });
    it('returns undefined for bad paths', function() {
      assert.isUndefined(this.tree.getBranchData('foo.bar.com'));
    });
  });

  describe('#delete', function() {
    let host1 = 'sub.mid.tld',
      host2 = 'sub2.mid.tld',
      host3 = 'mid.tld';

    beforeEach(function() {
      this.tree.set(host1, host1);
    });

    it('deletes item', function() {
      let {tree} = this;
      assert.equal(tree.get(host1), host1);

      assert.isTrue(tree.delete(host1));
      assert.equal(typeof tree.get(host1), 'undefined');

      assert.isFalse(tree.delete(host1));
      assert.isFalse(tree.delete(host2));
    })

    it('does not effect intermediates', function() {
      let {tree} = this;
      tree.set(host2, host2);

      tree.delete(host2);
      assert.equal(tree.get(host1), host1);
    });

    it('deleting intermediate does not effect children', function() {
      let {tree} = this;
      assert.isFalse(tree.delete(host3), 'cant delete intermediate domain');

      tree.set(host3, host3); // set the intermediate
      assert.isTrue(tree.delete(host3), 'deletes set intermediate');
      assert.isUndefined(tree.get(host3), 'cant get it');
      assert.equal(tree.get(host1), host1, 'subdomains uneffected');

      tree.set(host3, host3); // set the intermediate
      assert.isTrue(tree.delete(host1), 'deletes subdomain');
      assert.isUndefined(tree.get(host1), 'subdomain gone');
      assert.equal(tree.get(host3), host3);
    });
  });
});
