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
      let [key, val] = ['key', 'val'],
        res;

      await this.dmap.set(key, val);
      res = await this.dmap.get(key);

      assert.equal(res, val);
    });

    it('loads from disk', async function() {
      let disk = new FakeDisk(),
        name = 'name',
        [key, val] = ['key', 'val'];

      let dmap = new DiskMap(name, disk);
      dmap.set(key, val);

      let newDisk = await DiskMap.load(name, disk);
      assert.deepEqual(newDisk.keys, dmap.keys, 'same keys');
      assert.deepEqual(await newDisk.toMap(), await dmap.toMap(), 'same map');
    });
  });
});
