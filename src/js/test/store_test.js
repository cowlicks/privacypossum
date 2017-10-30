'use strict';

const assert = require('chai').assert,
  {DiskMap} = require('../store'),
  {FakeDisk} = require('./testing_utils');

describe('store.js', function() {
  describe('DiskMap', function() {
    beforeEach(function() {
      let disk = new FakeDisk(),
        name = 'name';
      this.dmap = new DiskMap(name, disk);
    });

    it('gets and sets', async function() {
      let keys = 'abcdefg'.split('');
      for (let i = 0; i < keys.length; i++) {
        await this.dmap.set(keys[i], i);
        assert.equal(await this.dmap.get(keys[i]), i);
      }
    });

    it('loads from disk', async function() {
      let keys = 'abcdefg'.split('');

      for (let i = 0; i < keys.length; i++) {
        await this.dmap.set(keys[i], i);
        assert.equal(await this.dmap.get(keys[i]), i);
      }

      let newDisk = await DiskMap.load(this.dmap.name, this.dmap.disk);
      assert.deepEqual(newDisk.keys, this.dmap.keys, 'same keys');
      assert.deepEqual(await newDisk.toMap(), await this.dmap.toMap(), 'same map');
    });
  });
});
