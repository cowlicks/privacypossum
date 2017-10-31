"use strict";

const assert = require('chai').assert,
  {DomainTree} = require('../domain_actions'),
  {splitter} = require('../suffixtree'),
  {FakeDisk} = require('./testing_utils');

describe('domain_actions.js', function() {
  describe('DomainTree', function() {
    let host = 'bar.foo.example.com',
      parts = host.split('.'),
      len = parts.length;

    beforeEach(function() {
      let disk = new FakeDisk(),
        name = 'name';
      this.dtree = new DomainTree(name, disk, splitter);
    });

    it('gets and sets', async function(){
      for (let i = 2; i <= len; i++) {
        let name = parts.slice(-i).join('.');

        await this.dtree.set(name, i);

        assert.equal(this.dtree.get(name), i);
      }
    });

    it('loads from disk', async function() {
      for (let i = 2; i <= len; i++) {
        let name = parts.slice(-i).join('.');
        await this.dtree.set(name, i);
      }

      let loadedTree = await DomainTree.load(
        this.dtree.diskMap.name, this.dtree.diskMap.disk, this.dtree.tree.splitter);

      this.dtree.keys.forEach(key => {
        assert.equal(loadedTree.get(key), this.dtree.get(key));
      });
    });
  });
});
