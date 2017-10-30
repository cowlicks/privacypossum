'use strict'

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

function Mock() {
  let out = function() {
    out.calledWith = Array.from(arguments);
  }
  return out;
}

function stub(name, value) {
  let parts = name.split('.'),
    last = parts.pop(),
    part = global;
  parts.forEach(partName => {
    if (!part.hasOwnProperty(partName)) {
      part[partName] = {};
    }
    part = part[partName];
  });
  part[last] = value;
}

function stubber(namesValues) {
  namesValues.forEach(nameValue => {
    stub(...nameValue);
  });
}

Object.assign(exports, {Mock, stub, stubber, FakeDisk});
