'use strict';

const assert = require('chai').assert,
  {Domain} = require('../schemes'),
  {testGetSetUpdate} = require('./testing_utils'),
  {Action} = require('../schemes');

describe('schemes.js', function() {
  describe('Domain', function() {
    it('get set update path', async function() {
      let [initKey1, initVal1] = ['initKey1', 'initVal1'],
        domain = new Domain({paths: {[initKey1]: initVal1}});

      assert.equal(domain.getPath(initKey1), initVal1);

      await testGetSetUpdate(domain, 'Path');
    });
  });
  it('get/set/updatePathAction', async function() {
    let domain = new Domain(),
      path = 'path',
      action = new Action('reason1', 'data1'),
      update = new Action('reason2', 'data2');
    await testGetSetUpdate(domain, 'PathAction', [path, action, update]);
  });
});
