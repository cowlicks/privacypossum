import chai from 'chai'; const {assert} = chai;
import * as fakes from '../fakes.js';

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
  describe('FakeDisk', function() {
    beforeEach(async function() {
      this.key = 'key', this.value = 'value';
      this.fd = new fakes.FakeDisk();
      await new Promise(resolve => this.fd.set(this.key, this.value, resolve));
    });
    it('sets & gets', async function() {
      // key with no data returns undefined
      assert.isUndefined(await new Promise(resolve => this.fd.get('does not exist', resolve)));
      assert.equal(await new Promise(resolve => this.fd.get(this.key, resolve)), this.value);
    });
    it('remove', async function() {
      await new Promise(resolve => this.fd.remove(this.key, resolve));
      assert.isUndefined(await new Promise(resolve => this.fd.get(this.key, resolve)));
    });
  });
})
