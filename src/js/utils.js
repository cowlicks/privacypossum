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

class FakeMessages {
  constructor() {
    this.funcs = [];
  }

  addListener(func) {
    this.funcs.push(func);
  }

  sendMessage() {
    this.funcs.forEach(func => func(...arguments));
  }
}

Object.assign(exports, {FakeDisk, FakeMessages});

})(typeof exports == 'undefined' ? require.scopes.utils = {} : exports);
