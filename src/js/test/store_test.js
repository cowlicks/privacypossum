"use strict";

const assert = require('chai').assert,
  {DomainTree} = require('../store');

describe('store.js', function() {
  describe('DomainTree', function() {
    let host = 'bar.foo.example.com',
      parts = host.split('.'),
      len = parts.length;

    beforeEach(function() {
      this.dtree = new DomainTree('name');
    });

    it('gets and sets', async function(){
      for (let i = 2; i <= len; i++) {
        let name = parts.slice(-i).join('.');

        await this.dtree.set(name, i);

        assert.equal(this.dtree.get(name), i);
      }
    });

    it('updates', async function(){
      await this.dtree.set(host, {a: 1});
      await this.dtree.update(host, {b: 2});

      assert.deepEqual(this.dtree.get(host), {a: 1, b: 2});
    });

    it('loads from disk', async function() {
      for (let i = 2; i <= len; i++) {
        let name = parts.slice(-i).join('.');
        await this.dtree.set(name, i);
      }

      let loadedTree = await DomainTree.load(
        this.dtree.diskMap.name, this.dtree.diskMap.disk);

      assert.deepEqual(loadedTree.keys, this.dtree.keys);
      this.dtree.keys.forEach(key => {
        assert.equal(loadedTree.get(key), this.dtree.get(key));
      });
    });
  });
});
