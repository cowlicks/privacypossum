"use strict";

(function(exports) {

const {Listener} = require('./utils');

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

  clear() {
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

class Port {
  constructor(name) {
    this.name = name;
    this.onMessage = new Listener();
    this.onDisconnect = new Listener();
  }

  setOther(other) {
    this.otherPort = other;
  }
  async postMessage() {
    for (let func of this.otherPort.onMessage.funcs) {
      await func(...arguments);
    }
  }
}

// this should be cleaned up, and probably moved into shim.js or testing_utils.js
function fakePort(name) {
  let a = new Port(name), b = new Port(name);
  a.setOther(b);
  b.setOther(a);
  return [a, b];
}

function fakeConnects () {
  let connections = [];
  let onConnect = {funcs: []};
  onConnect.addListener = (func) => {
    onConnect.funcs.push(func);
  }
  let connect = function({name}) {
    let [port, otherPort] = fakePort(name);
    connections.push([port, otherPort]);
    for (let func of onConnect.funcs) {
      func(otherPort);
    }
    return port;
  }
  return [connect, onConnect];
}

Object.assign(exports, {FakeDisk, FakeMessages, fakePort, fakeConnects});

})(typeof exports == 'undefined' ? require.scopes.fakes = {} : exports);
