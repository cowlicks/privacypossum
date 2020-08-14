/**
 * Ideally shims should be as simple as possible so as not to require testing.
 * Some are a little more complicated so we test them here.
 */
"use strict";

import chai from 'chai'; const {assert} = chai;
import {shims} from '../shim.js';
const {connect, onConnect} = shims;

describe('shim.js', function() {
  describe('connect and onConnect', function() {
    it('creates port that can send data', async function() {
      let name = 'test_name',
        called = false;

      onConnect.addListener(port => {
        assert.equal(port.name, name);
        port.onMessage.addListener(data => {
          called = true;
          assert.deepEqual(data, {a: 1, b: 2});
        });
      });

      let port = connect({name});
      assert.equal(port.name, name);
      await port.postMessage({a: 1, b: 2});
      assert.isTrue(called);
    });
  });
});
