import chai from 'chai'; const {assert} = chai;
import {DiskMap} from '../disk_map.js';
import {shim} from '../shim.js';
const {Disk} = shim;

describe('disk_map.js', function() {
  describe('DiskMap', function() {
    beforeEach(function() {
      let disk = Disk.newDisk(),
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

    it('deletes', async function() {
      let key = 'key', val = 'val';
      await this.dmap.set(key, val);
      assert.equal(await this.dmap.get(key), val);

      assert.isTrue(await this.dmap.delete(key));
      assert.isFalse(this.dmap.has(key));
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
