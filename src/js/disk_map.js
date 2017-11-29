"use strict";
/**
 * DiskMap wraps an asynchronous get/set api, and prefixes its keys with a
 * string, effectively giving each instance of DiskMap a namespace. This allows
 * us to store arbitrary keys without having to worry about collisions with
 * keys from other things.
 *
 * Another way to acheive namespacing like this is to store a nested object.
 * But everytime you update an entry in the object this way, it updates the
 * whole thing. So storing large frequently updated objects can potentially be
 * resource intensive. So instead we do this.
 */

[(function(exports) {

class DiskMap {
  constructor(name, disk) {
    this.disk = disk;
    this.name = name;
    this.keys_key = 'keys_for_' + name;
    this.keys = new Set();
  }

  static async load(name, disk) {
    let out = new DiskMap(name, disk);
    await out.loadKeys();
    return out;
  }

  async loadKeys() {
    this.keys = await this.getKeys();
  }

  async getKeys() {
    return new Promise(resolve => {
      this.disk.get(this.keys_key, keys => {
        keys = (typeof keys === 'undefined') ? [] : keys;
        resolve(new Set(keys));
      });
    });
  }

  maybeAddKey(key) {
    return new Promise(resolve => {
      if (this.keys.has(key)) {
        return resolve();
      }
      this.keys.add(key);
      return this.disk.set(this.keys_key, Array.from(this.keys), resolve);
    });
  }

  async toMap() {
    let out = new Map();
    for (let key of this.keys) {
      out.set(key, await this.get(key));
    }
    return out;
  }

  async set(key, value) {
    await this.maybeAddKey(key);
    return new Promise(resolve => {
      this.disk.set((this.name + key), [key, value], resolve);
    });
  }

  get(key) {
    return new Promise(resolve => {
      this.disk.get((this.name + key), keyValue => resolve(keyValue[1]));
    });
  }

  has(key) {
    return this.keys.has(key);
  }
}

Object.assign(exports, {DiskMap});

})].map(func => typeof exports == 'undefined' ? require.scopes.disk_map = func : func(exports));
