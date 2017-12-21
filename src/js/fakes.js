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
    this.messages = [];
  }

  clear() {
    this.funcs = [];
    this.messages = [];
  }

  addListener(func) {
    this.funcs.push(func);
  }

  async sendMessage() {
    this.messages.push(Array.from(arguments).slice(0, arguments.length))
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

class Connects extends Function {
  // returs fake [connect, onConnect]
  static create() {
    let onConnect = new Connects();
    let connect = new Proxy(onConnect, {
      apply: function(target, thisArg, argList) {
        return target.connect.apply(target, argList);
      }
    });
    return [connect, onConnect];
  }

  constructor() {
    super();
    this.funcs = [];
  }

  addListener(func) {
    this.funcs.push(func);
  }

  clear() {
    this.funcs = []
  }

  connect({name}) {
    let [port, otherPort] = fakePort(name);
    for (let func of this.funcs) {
      func(otherPort);
    }
    return port;
  }
}

Object.assign(exports, {FakeDisk, FakeMessages, fakePort, Connects});

})(typeof exports == 'undefined' ? require.scopes.fakes = {} : exports);
