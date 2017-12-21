"use strict";

[(function(exports) {

const {activeIcons, inactiveIcons} = require('./constants'),
    {setIcon} = require('./shim');

function memoize(func, hash, size) {
  let cache = new Map();
  return function() {
    let key = hash(arguments);
    if (cache.has(key)) {
      return cache.get(key);
    }
    let result = func.apply(undefined, arguments);
    cache.set(key, result);
    if (cache.size > size) {
      cache.delete(cache.keys().next().value);
    }
    return result;
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

// move to shim
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

/*
 * Make a class have an eventListener interface. The base class needs to
 * implement a `getData` function and call the `onChange` function when
 * appropriate.
 */
let listenerMixin = (Base) => class extends Base {
  constructor() {
    super();
    this.funcs = new Set();
    this.onChange = this.onEvent;
  }

  addListener(func) {
    this.funcs.add(func)
  }

  removeListener(func) {
    this.funcs.delete(func);
  }

  onEvent() {
    this.funcs.forEach(func => func(this.getData()));
  }

  getData() {
  }
}

// todo after setIcon return's a promise, make this return a promise
function setTabIconActive(tabId, active) {
  let icons = active ? activeIcons : inactiveIcons;
  setIcon({tabId: tabId, path: icons});
}

function hasAction(obj, reason) {
  return obj.hasOwnProperty('action') && (obj.action.reason === reason);
}

class Listener extends listenerMixin(Object) {}

// check if hostname has the given basename
function isBaseOfHostname(base, host) {
  return host.endsWith(base) ?
    (base.length === host.length || host.substr(-base.length - 1, 1) === '.') :
    false;
}


Object.assign(exports, {
  memoize,
  BrowserDisk,
  makeTrap,
  listenerMixin,
  Listener,
  setTabIconActive,
  hasAction,
  isBaseOfHostname,
});

})].map(func => typeof exports == 'undefined' ? require.scopes.utils = func : func(exports));
