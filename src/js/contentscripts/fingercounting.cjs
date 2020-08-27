"use strict";

[(function(exports) {
/**
 * This watches methods that are commonly used for fingerprinting, and reports
 * when a suspicious number of them are used by one script.
 *
 * We watch the methods by adding some accounting code to their getters, see `wrapMethod`.
 *
 * In the accounting code we track the usage *per script*. We determine which
 * script is accessing the method by checking the stack, see `getScriptLocation`.
 */

function makeFingerCounting(event_id = 0, init = true) {
  // stuff for default config in browser
  const threshold = 0.60;

  function send(msg) {
    document.dispatchEvent(new CustomEvent(event_id, {detail: msg}));
  }

  function listen(func) {
    document.addEventListener(event_id, func);
  }

  // gets the location of arguments.callee.caller
  function getScriptLocation() {  // todo: to do split('\n') we do a O(n) read of the stack, this could be reduced by a constant factor by only reading to the third '\n'. but this is micro optimisation
    let lines = (new Error()).stack.split('\n');
    try {
      try {
        return getUrlFromStackLine(lines[3]);
      } catch (e) {
        return getUrlFromStackLine(lines[2]);
      }
    } catch (ee) {
      return null;
    }
  }

  const urlEndRegex = /^.*?.(?=(\?|#|:(?!\/\/)))/,
    startsWithHttpScheme = /^https?:\/\//;

  function getUrlFromStackLine(line) {
    while (line.slice(-1) === ')') { // there are parenthese
      line = line.slice(line.lastIndexOf('(') + 1);
      line = line.slice(0, line.indexOf(')'));
    }
    line = line.split(' ').pop(); // remove stuff up to the url
    if (!startsWithHttpScheme.test(line) && !line.startsWith('/')) {
      // in firefox we have to strip func name
      line = line.slice(line.indexOf('@') + 1);
    }
    return line.match(urlEndRegex)[0]; // strip stuff after the path of url (query, hash, and line numbers);
  }

  function randString() {
    return Math.random().toString(36).substr(2);
  }

  function randNumber(min = 0, max = 1) {
    return (Math.random() * (max - min)) + min;
  }

  function randInt(min, max) {
    return Math.floor(randNumber(min, max));
  }

  function randArr(min, max, filler) {
    return () => {
      let size = randInt(min, max)
      return Array.from(new Array(size), filler);
    }
  }

  let randoThing = {
    [Symbol.toPrimitive](hint) {
      if (hint === 'number') {
        return randInt(0, 10);
      }
      if (hint === 'string') {
        return randString();
      }
      return true;
    }
  }

  function trap() {
    let target = () => {},
      lol = (target, property) => {
        if (typeof property === 'symbol' && property === Symbol.toPrimitive) {
          return randoThing[property];
        }
        return new Proxy(target, descriptor);
      },
      descriptor = {apply: lol, get: lol};
    return lol(target);
  }


  function noop() {return noop};

  /**
   * fingerprintjs2 defines the following "keys"
   *
   * then some jsFontsKeys and flashFontsKeys
   *
   * I'll try to catch each of these
   */
  const methods = [
    //    keys = this.userAgentKey(keys);
    ['navigator.userAgent', randString],
    //    keys = this.languageKey(keys);
    ['navigator.language', randString],
    //    keys = this.pixelRatioKey(keys);
    ['window.devicePixelRatio', randNumber.bind(0, 2)],
    //    keys = this.hasLiedLanguagesKey(keys);
    ['navigator.languages', randArr(0, 7, randString)],
    //    keys = this.colorDepthKey(keys);
    ['screen.colorDepth', randInt.bind(5, 40)],
    //    keys = this.hardwareConcurrencyKey(keys);
    ['navigator.hardwareConcurrency', randInt.bind(1, 10)],
    //    keys = this.cpuClassKey(keys);
    ['navigator.cpuClass', trap()],
    //    keys = this.platformKey(keys);
    ['navigator.platform', randString],
    //    keys = this.doNotTrackKey(keys);
    ['navigator.doNotTrack', trap()],
    //    keys = this.touchSupportKey(keys);
    ['navigator.maxTouchPoints', randInt.bind(0, 5)],

    //    keys = this.screenResolutionKey(keys);
    ['screen.width', randInt.bind(500, 3000)],
    //    keys = this.availableScreenResolutionKey(keys);
    ['screen.availWidth', randInt.bind(500, 3000)],
    // these also are counted with:
    //    keys = this.hasLiedResolutionKey(keys);

    //    keys = this.timezoneOffsetKey(keys);
    ['Date.prototype.getTimezoneOffset', () => randInt.bind(0, 200)],
    //    keys = this.sessionStorageKey(keys);
    ['window.sessionStorage', noop],
    //    keys = this.localStorageKey(keys);
    ['window.localStorage', noop],
    //    keys = this.indexedDbKey(keys);
    ['window.indexedDB', noop],
    //    keys = this.openDatabaseKey(keys);
    ['window.openDatabase', noop],
    //    keys = this.pluginsKey(keys);
    ['navigator.plugins', trap()],
    //    keys = this.canvasKey(keys);
    ['window.HTMLCanvasElement.prototype.getContext', trap()],
    //    keys = this.webglKey(keys);
    ['window.WebGLRenderingContext.prototype.createBuffer', trap()],
    //    keys = this.adBlockKey(keys);
    //    keys = this.addBehaviorKey(keys);
    //    keys = this.hasLiedOsKey(keys);
    //    keys = this.hasLiedBrowserKey(keys);
    //    keys = this.customEntropyFunction(keys);
  ];

  class Counter {
    constructor({globalObj, methods, getScriptLocation, threshold, send, listen}) {
      Object.assign(this, {globalObj, methods, getScriptLocation, threshold, send, listen});

      this.locations = {};
      this.nMethods = methods.length;
      for (const [name, lieFunc] of methods) {
        this.wrapMethod(name, lieFunc);
      }

      this.listen(this.firstpartyFingerprintingListener.bind(this));
      this.send({type: 'ready'});
    }

    onFingerprinting(loc) {
      this.send({type: 'fingerprinting', url: loc});
    }

    firstpartyFingerprintingListener(e) {
      let {type, url} = e.detail;
      if (type === 'firstparty-fingerprinting') {
        if (!this.locations.hasOwnProperty(url)) {
          this.locations[url] = this.addLocation();
        }
        this.locations[url].isFingerprinting = true;
      }
    }

    // wrap a dotted method name with a counter
    wrapMethod(dottedPropName, lieFunc) {
      function getDescriptor(obj, prop) {
        while (obj && !obj.hasOwnProperty(prop)) {
          obj = Object.getPrototypeOf(obj);
        }
        return obj ? Object.getOwnPropertyDescriptor(obj, prop) :
          {value: undefined, writable: false, configurable: false, enumerable: false};
      }

      const self = this,
        arr = dottedPropName.split('.'),
        propName = arr.pop();

      let baseObj = arr.reduce((o, i) => o[i], this.globalObj);

      let descriptor = getDescriptor(baseObj, propName),
        {configurable, enumerable} = descriptor,
        isAccessor = descriptor.hasOwnProperty('get'),
        prop = isAccessor ? descriptor.get : descriptor.value;
      try {
        Object.defineProperty(baseObj, propName, {
          get: function() {
            let loc = self.addCall(dottedPropName, self.getScriptLocation());
            if (loc.isFingerprinting) {
              return lieFunc(prop);
            }
            if (this !== baseObj && this.hasOwnProperty(propName)) {
              return this[propName];
            }
            return isAccessor ? prop.call(this) : prop;
          },
          set: function(value) {
            // settable
            if (isAccessor) {
              return descriptor.set ? descriptor.set.call(this, value) : value;
            }
            // not settable and not writeable
            if (!descriptor.writable) {
              // should throw TypeError if !== prop or this[propName] and in strict mode;
              return value;
            }
            // writable value
            if (baseObj === this) { // we wrapped the instance
              return prop = value;
            } else {
               // wrapped something up the prototype chain
              Object.defineProperty(this, propName, {value, configurable, enumerable, writable: descriptor.writable});
              return value;
            }
          },
          configurable,
          enumerable,
        });
      } catch (ignore) {
        // property probably non-configurable from other userscript
      }
    }

    addLocation() {
      return {isFingerprinting: false, counts: {}, nnzCounts: 0};
    }

    /*
     * Keep a running score/nnzCounts. This lets us avoid polling
     * counter.isFingerprinting.
     */
    addCall(prop_name, loc_name) {
      if (!loc_name) {
        return;
      }

      let loc = this.locations[loc_name];
      if (!loc) {
        loc = this.locations[loc_name] = this.addLocation();
      }

      if (!loc.counts.hasOwnProperty(prop_name)) {
        loc.counts[prop_name] = 0;
        loc.nnzCounts += 1;

        if ((loc.nnzCounts/this.nMethods) > this.threshold &&
            (!loc.isFingerprinting)) {
          loc.isFingerprinting = true;
          this.onFingerprinting(loc_name);
        }
      }

      loc.counts[prop_name] += 1;
      return loc;
    }
  };
  // initialize for browser
  function initialize() {
    const config = {
      globalObj: window,
      methods,
      getScriptLocation,
      threshold,
      send,
      listen,
    };

    return new Counter(config); // eslint-disable-line
  }
  if (init) {
    return initialize();
  } else {
    return {Counter, getUrlFromStackLine, initialize};
  }
}

Object.assign(exports, {makeFingerCounting});

})].map(func => typeof exports == 'undefined' ? define('/contentscripts/fingercounting', func) : func(exports));
