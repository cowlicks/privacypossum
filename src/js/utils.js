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

function makeTrap() {
  let target = () => {};
  let lol = () => {
    return new Proxy(target, descriptor);
  };
  let descriptor = {
    apply: lol,
    get: lol,
  };
  return lol();
}

// this should be cleaned up, and probably moved into shim.js or testing_utils.js
function fakePort(name) {
  let a = {name, onMessage: {}, funcs: []}, b = {name, onMessage: {}, funcs: []};
  a.onMessage.addListener = (func) => {
    a.funcs.push(func);
  };
  b.onMessage.addListener = (func) => {
    b.funcs.push(func);
  };

  a.postMessage = async function() {
    for (let func of b.funcs) {
      await func(...arguments);
    }
  }
  b.postMessage = async function() {
    for (let func of a.funcs) {
      await func(...arguments);
    }
  }
  return [a, b];
}

Object.assign(exports, {FakeDisk, BrowserDisk, FakeMessages, fakePort, makeTrap});

})(typeof exports == 'undefined' ? require.scopes.utils = {} : exports);
