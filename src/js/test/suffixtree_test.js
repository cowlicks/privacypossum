'use strict';

const assert = require('chai').assert,
  Tree = require('../suffixtree').Tree;

describe('suffixtree.js', function() {
  let host1 = 'example.com',
    host2 = 'foo.bar.com',
    val1 = 42,
    val2 = 'value';

  beforeEach(function() {
    this.tree = new Tree();
  });

  it('getItem and setItem', function() {
    this.tree.setItem(host1, val1);
    assert.equal(this.tree.getItem(host1), val1);
    assert.isUndefined(this.tree.getItem('nope'));
  });

  it('serializes and unserializes', function() {
    this.tree.setItem(host1, val1);
    this.tree.setItem(host2, val2);

    let string = this.tree.serialize();
    let newTree = Tree.deserialize(string);

    assert.equal(this.tree.getItem(host1), newTree.getItem(host1));
    assert.equal(this.tree.getItem(host2), newTree.getItem(host2));
  });
});
