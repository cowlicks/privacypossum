'use strict';

const assert = require('chai').assert,
  {Tree, splitter} = require('../suffixtree');

describe('suffixtree.js', function() {
  let host = 'bar.foo.example.com',
    parts = host.split('.'),
    len = parts.length;

  beforeEach(function() {
    this.tree = new Tree(splitter);
  });

  it('getItem and setItem', function() {
    for (let i = 2; i <= len; i++) {
      let name = parts.slice(-i).join('.');

      this.tree.setItem(name, i);

      assert.equal(this.tree.getItem(name), i);
    }

  });

  describe('#aggregate', function() {
    it('gathers along a path', function() {
      let expected = new Map();
      for (let i = 2; i <= len; i++) {
        let n = parts.slice(-i).join('.');

        this.tree.setItem(n, i);

        expected.set(n.split('.').shift(), i);
      }

      let result = this.tree.getBranchData(host);
      assert.deepEqual(result, expected);
      expected.forEach(key => assert.equal(result.get(key), expected.get(key)));
    });
    it('returns undefined for bad paths', function() {
      assert.isUndefined(this.tree.getBranchData('foo.bar.com'));
    });
  });
});
