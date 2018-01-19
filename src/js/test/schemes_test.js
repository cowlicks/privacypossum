'use strict';

const assert = require('chai').assert,
  {Domain} = require('../schemes');


describe('schemes.js', function() {
  describe('Domain', function() {
    it('get set update path', async function() {
      let [initKey1, initVal1] = ['initKey1', 'initVal1'],
        domain = new Domain({paths: {[initKey1]: initVal1}});

      assert.equal(domain.getPath(initKey1), initVal1);

      let [getter, setter, updater] = makeGetterSetterUpdater(domain, 'Path');
      await getSetUpdateTest(getter, setter, updater);
    });
  });
  it('get/set/updatePathAction', async function() {
    let domain = new Domain(),
      [getter, setter, updater] = makeGetterSetterUpdater(domain, 'PathAction');
    await getSetUpdateTest(getter, setter, updater);
  });
});

function makeGetterSetterUpdater(obj, suffix) {
  return ['get', 'set', 'update'].map(prefix => obj[prefix + suffix].bind(obj));
}

async function getSetUpdateTest(getter, setter, updater) {
  let [k1, v1] = ['k1', 'v1'], update = 'update';

  setter(k1, v1);
  assert.deepEqual(getter(k1), v1);

  let before = await new Promise(resolve => {
    updater(k1, value => {
      resolve(value);
      return update;
    });
  });
  assert.equal(before, v1);
  assert.equal(getter(k1), update);
}
