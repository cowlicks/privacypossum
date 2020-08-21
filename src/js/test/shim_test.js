/**
 * Ideally shim should be as simple as possible so as not to require testing.
 * Some are a little more complicated so we test them here.
 */

import chai from 'chai'; const {assert} = chai;
import {shim} from '../shim.js';
const {connect, onConnect, wrapObject} = shim;

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

  describe('wrapObject', ()=> {
    it('wraps objects', () => {
      let base = {a: 6},
        base2 = {a: 7};
      let wrapped = wrapObject(base);

      assert.equal(wrapped.a, 6);
      wrapped.b = 'b1';
      assert.equal(wrapped.b, 'b1');

      wrapped.setBase = base2;

      assert.equal(wrapped.a, 7);
      assert.equal(wrapped.b, undefined);
    });

    it('methods work', () => {
      let base = {
        a() {
          return this.b;
        },
        b: 6,
      };
      let base2 = {
        a() {
          return this.b;
        },
        b: 7,
      };
      let wrapped = wrapObject(base);
      assert.equal(wrapped.a(), 6);

      wrapped.setBase = base2;
      assert.equal(wrapped.a(), 7);
    });
  });
});
