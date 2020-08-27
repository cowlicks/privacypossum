import chai from 'chai'; const {assert} = chai;
import {Store} from '../store.js';
import {Domain, Action} from '../schemes.js';

describe('store.js', function() {
  describe('Store', function() {
    let host = 'bar.foo.example.com',
      parts = host.split('.'),
      len = parts.length;

    async function loadNewFromTree({diskMap: {name, disk}}) {
      return await Store.load(name, disk);
    }

    beforeEach(function() {
      this.dtree = new Store('name');
    });

    it('deletes', async function() {
      let host = 'some.key.com', path1 = '/val1', path2 = '/val2',
        url1 = `https://${host}${path1}`, url2 = `https://${host}${path2}`,
        action1 = new Action(path1), action2 = new Action(path2);

      await this.dtree.setUrl(url1, action1);
      await this.dtree.setUrl(url2, action2);

      await this.dtree.deleteUrl(url1);

      assert.isUndefined(this.dtree.getUrl(url1));
      assert.equal(this.dtree.getUrl(url2), action2);
      assert.deepEqual(this.dtree.getDomain(url2), {paths: {[path2]: {action: action2}}});

      let newTree = await loadNewFromTree(this.dtree);

      // unchanged after loading
      assert.deepEqual(newTree.getDomain(url2), {paths: {[path2]: {action: action2}}});

      await newTree.deleteDomain(url1);
      assert.isUndefined(newTree.getDomain(url1));
    });

    it('gets and sets', async function(){
      for (let i = 2; i <= len; i++) {
        let name = parts.slice(-i).join('.');

        let val = new Domain(i);

        await this.dtree.set(name, val);

        assert.deepEqual(this.dtree.get(name), val);
      }
    });

    it('updates', async function(){
      await this.dtree.set(host, new Domain());
      await this.dtree.update(host, (domain) => domain.setPath('a', 'b'));

      assert.deepEqual(this.dtree.get(host), new Domain().setPath('a', 'b'));
    });

    it('loads from disk', async function() {
      for (let i = 2; i <= len; i++) {
        let name = parts.slice(-i).join('.');
        await this.dtree.set(name, i);
      }

      let loadedTree = await loadNewFromTree(this.dtree);

      assert.deepEqual(loadedTree.keys, this.dtree.keys);
      this.dtree.keys.forEach(key => {
        assert.deepEqual(loadedTree.get(key), this.dtree.get(key));
      });
    });
  });
});
