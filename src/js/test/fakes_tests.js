'use strict';

const assert = require('chai').assert,
  fakes = require('../fakes');

describe('fakes.js', function() {
  describe('Connects', function() {
    it('make connect & onConnect', function() {
      let called = false,
        name = 'name',
        [connect, onConnect] = fakes.Connects.create();
      onConnect.addListener(port => {
        assert.equal(port.name, name);
        called = true;
      });

      let port = connect({name});
      assert.equal(port.name, name);
      assert.isTrue(called);

      connect.clear();
    });
  })
})
