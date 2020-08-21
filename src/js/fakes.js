import {Listener} from './utils.js';

async function asyncify(func) {
  return new Promise(resolve => setTimeout(() => resolve(func())));
}

class FakeDisk extends Map {
  constructor() {
    super(...arguments);
    this.getter = super.get.bind(this);
    this.setter = super.set.bind(this);
    this.deleter = super.delete.bind(this);
  }

  async get(key, cb) {
    return asyncify(() => cb(this.getter(key)));
  }

  async set(key, value, cb) {
    return asyncify(() => cb(this.setter(key, value)));
  }

  async delete(key, cb) {
    return asyncify(() => cb(this.deleter(key)));
  }
  async remove(key, cb) {
    return this.delete(key, cb);
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

  async disconnect() {
    for (let func of this.otherPort.onDisconnect.funcs) {
      await func(...arguments);
    }
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

export {FakeDisk, FakeMessages, fakePort, Connects};
