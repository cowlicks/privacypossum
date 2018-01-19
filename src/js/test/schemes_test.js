'use strict';

const assert = require('chai').assert,
  {Domain} = require('../schemes');


describe('schemes.js', function() {
  describe('Domain', function() {
    it('get set update path', async function() {
      let [[k1, v1], [k2, v2]] = [['k1', 'v1'], ['k2', 'v2']],
        update = 'update',
        d = new Domain({paths: {[k1]: v1}});

      assert.deepEqual(d.getPath(k1), v1);

      d.setPath(k2, v2);
      assert.deepEqual(d.getPath(k2), v2);

      let before = await new Promise(resolve => {
        d.updatePath(k2, value => {
          resolve(value);
          return update;
        });
      });
      assert.equal(before, v2);
      assert.equal(d.getPath(k2), update);
    });
  });
});
