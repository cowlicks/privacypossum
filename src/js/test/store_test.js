"use strict";

const assert = require('chai').assert,
  {DomainStore} = require('../store'),
  {Domain} = require('../schemes');

describe('store.js', function() {
  describe('DomainStore', function() {
    let host = 'bar.foo.example.com',
      parts = host.split('.'),
      len = parts.length;

    async function loadNewFromTree({diskMap: {name, disk}}) {
      return await DomainStore.load(name, disk);
    }

    beforeEach(function() {
      this.dtree = new DomainStore('name');
    });

    it('deletes', async function() {
      let key = 'some.key.com', val = new Domain('val');
      assert.isUndefined(this.dtree.get(key));

      await this.dtree.set(key, val);
      await this.dtree.delete(key);

      let newTree = await loadNewFromTree(this.dtree);

      assert.isFalse(newTree.has(key), 'not in new tree');
    });

    it('gets and sets', async function(){
      for (let i = 2; i <= len; i++) {
        let name = parts.slice(-i).join('.');

        let val = new Domain(i);

        await this.dtree.set(name, val);

        assert.deepEqual(this.dtree.get(name), val);
      }
    });

    it('updates', async function(){
      await this.dtree.set(host, new Domain());
      await this.dtree.update(host, (domain) => domain.setPath('a', 'b'));

      assert.deepEqual(this.dtree.get(host), new Domain().setPath('a', 'b'));
    });

    it('loads from disk', async function() {
      for (let i = 2; i <= len; i++) {
        let name = parts.slice(-i).join('.');
        await this.dtree.set(name, i);
      }

      let loadedTree = await loadNewFromTree(this.dtree);

      assert.deepEqual(loadedTree.keys, this.dtree.keys);
      this.dtree.keys.forEach(key => {
        assert.deepEqual(loadedTree.get(key), this.dtree.get(key));
      });
    });
  });
});
