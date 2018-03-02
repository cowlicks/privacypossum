"use strict";

[(function(exports) {

const {activeIcons, inactiveIcons} = require('./constants'),
    {setIcon, tabsQuery} = require('./shim');

async function currentTab() {
  const active = true, lastFocusedWindow = true;
  return new Promise(resolve => {
    tabsQuery({active, lastFocusedWindow}, tabsFirstTry => {
      if (tabsFirstTry.length > 0) {
        resolve(tabsFirstTry[0]);
      } else { // tab not focused
        tabsQuery({active}, tabsSecondTry => {
          resolve(tabsSecondTry[0]);
        });
      }
    });
  });
}

/*
 * View of some remote data represented by a `Model`.
 */
class View {
  constructor(port, onChange) {
    Object.assign(this, {
      disconnect: port.disconnect.bind(port),
      onChange
    });
    this.ready = new Promise(resolve => {
      port.onMessage.addListener(obj => {
        if (obj.change) {
          onChange(obj.change);
          resolve();
        }
      });
    });
  }
}

/*
 * Model that sends data changes to a corresponding view.
 *
 * Takes a `port` and an object with an `onChange` and `addListener`
 * methods. `onChange` is called directly first to send the initial data.
 *
 * todo: add a mixin that conforms to changer interface
 */
class Model {
  constructor(port, data) {
    this.data = data;
    this.func = change => port.postMessage({change});
    data.addListener(this.func);
    data.onChange(); // send initial data
    port.onDisconnect.addListener(() => this.delete());
  }

  delete() {
    this.data.removeListener(this.func);
  }
}

class Counter extends Map {
  add(name) {
    if (!this.has(name)) {
      this.set(name, 0);
    }
    return this.set(name, this.get(name) + 1);
  }
}

class FifoMap extends Map {
  constructor(maxSize) {
    super();
    Object.assign(this, {maxSize});
  }

  set(key, val) {
    super.set(key, val);
    if (this.size > this.maxSize) {
      this.delete(this.keys().next().value);
    }
  }
}

class LogBook extends FifoMap {
  constructor() {
    super(...arguments);
    this.print = true;
    this.count = 0;
  }

  dump() {
    return Array.from(this).reverse();
  }

  log(entry) {
    if (this.print) {
      console.log(entry); // eslint-disable-line
    }
    this.set(this.count, entry);
    this.count += 1;
    return this;
  }
}

function lazyDef(exports_, name, definerFunc) {
  Object.assign(exports_, {
    get [name]() {
      delete this[name];
      return this[name] = Object.assign(exports_, definerFunc())[name];
    }
  });
}

/*
 * Memoize the function `func`. `hash` coneverts the functions arguments into a
 * key to reference the result in the cache. `size` is the max size of the
 * cache.
 */
function memoize(func, hash, size) {
  let cache = new FifoMap(size);
  return function() {
    let key = hash(arguments);
    if (cache.has(key)) {
      return cache.get(key);
    }
    let result = func.apply(undefined, arguments);
    cache.set(key, result);
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

  delete(key, cb) {
    return this.disk.remove(key, cb);
  }
  remove(key, cb) {
    return this.delete(key, cb);
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

  onEvent(event_) {
    this.funcs.forEach(func => func(this.getData(event_)));
  }

  getData(event_) {
    return event_;
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
isBaseOfHostname = memoize(isBaseOfHostname, ([base, host]) => base + ' ' + host, 1000);

function passThrough() {
  return Array.from(arguments);
}

function wrap(func, before = passThrough, after = passThrough) {
  return function() {
    return after(func.apply(undefined, before.apply(undefined, arguments)));
  }
}

function zip() {
  let args = Array.from(arguments),
    nargs = args.length,
    out = [];

  if (!nargs) return;

  for (let i = 0; i < nargs; i++) {
    let arr = args[i],
      len = arr.length;
    for (let j = 0; j < len; j++) {
      if (j >= out.length) out.push([]);
      out[j].push(arr[j]);
    }
  }
  return out;
}

lazyDef(exports, 'log', () => {
  let logger = new LogBook(100);
  return {logger, log: logger.log.bind(logger)};
});

Object.assign(exports, {
  currentTab,
  View,
  Model,
  Counter,
  memoize,
  LogBook,
  BrowserDisk,
  makeTrap,
  listenerMixin,
  Listener,
  setTabIconActive,
  hasAction,
  isBaseOfHostname,
  lazyDef,
  wrap,
  zip,
});

})].map(func => typeof exports == 'undefined' ? define('/utils', func) : func(exports));
