"use strict";

(function(exports) {

async function asyncify(func) {
  return new Promise(resolve => setTimeout(() => resolve(func())));
}

class FakeDisk extends Map {
  async get(key, cb) {
    let getter = super.get.bind(this);
    return asyncify(() => cb(getter(key)));
  }

  async set(key, value, cb) {
    let setter = super.set.bind(this);
    return asyncify(() => cb(setter(key, value)));
  }
}

class BrowserDisk {
  constructor(disk) {
    this.disk = disk;
  }

  get(key, cb) {
    this.disk.get(key, (res) => {
      return (res.hasOwnProperty(key)) ? cb(res[key]) : cb();
    });
  }

  set(key, value, cb) {
    return this.disk.set({[key]: value}, cb);
  }
}

class FakeMessages {
  constructor() {
    this.funcs = [];
  }

  addListener(func) {
    this.funcs.push(func);
  }

  async sendMessage() {
    for (let func of this.funcs) {
      await func(...arguments);
    }
  }
}

Object.assign(exports, {FakeDisk, BrowserDisk, FakeMessages});

})(typeof exports == 'undefined' ? require.scopes.utils = {} : exports);
