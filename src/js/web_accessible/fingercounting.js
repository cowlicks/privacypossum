"use strict";

(function(exports) {
/**
 * This watches methods that are commonly used for fingerprinting, and reports
 * when a suspicious number of them are used by one script.
 *
 * We watch the methods by adding some accounting code to their getters, see `wrapMethod`.
 *
 * In the accounting code we track the usage *per script*. We determine which
 * script is accessing the method by checking the stack, see `getScriptLocation`.
 *
 * todo: add a way for methods to lie.
 * todo: better name than "method"?
 */

// stuff for default config in browser
const threshold = 0.75;

let event_id;

function send(msg) {
  document.dispatchEvent(new CustomEvent(event_id, {detail: msg}));
}

function listen(func) {
  document.addEventListener(event_id, func);
}

// get the location of arguments.callee.caller
function getScriptLocation() {
  return getUrlFromStackLine(new Error().stack.split('\n')[3]);
}

const urlEndRegex = /^.*?.(?=(\?|#|:(?!\/\/)))/;
function getUrlFromStackLine(line) {
  return line.slice(line.indexOf('http')) // http://foo.bar/path?q=p#frag:somestuff
    .match(urlEndRegex)[0];
}

/**
 * fingerprintjs2 defines the following "keys"
 *
 * then some jsFontsKeys and flashFontsKeys
 *
 * I'll try to catch each of these
 */
const methods = [
  //    keys = this.userAgentKey(keys);
  'navigator.userAgent',
  //    keys = this.languageKey(keys);
  'navigator.language',
  //    keys = this.pixelRatioKey(keys);
  'window.devicePixelRatio',
  //    keys = this.hasLiedLanguagesKey(keys);
  'navigator.languages',
  //    keys = this.colorDepthKey(keys);
  'screen.colorDepth',
  //    keys = this.hardwareConcurrencyKey(keys);
  'navigator.hardwareConcurrency',
  //    keys = this.cpuClassKey(keys);
  'navigator.cpuClass',
  //    keys = this.platformKey(keys);
  'navigator.platform',
  //    keys = this.doNotTrackKey(keys);
  'navigator.doNotTrack',
  //    keys = this.touchSupportKey(keys);
  'navigator.maxTouchPoints',

  //    keys = this.screenResolutionKey(keys);
  'screen.width',
  //    keys = this.availableScreenResolutionKey(keys);
  'screen.availWidth',
  // these also are counted with:
  //    keys = this.hasLiedResolutionKey(keys);

  //    keys = this.timezoneOffsetKey(keys);
  'Date.prototype.getTimezoneOffset',
  //    keys = this.sessionStorageKey(keys);
  'window.sessionStorage',
  //    keys = this.localStorageKey(keys);
  'window.localStorage',
  //    keys = this.indexedDbKey(keys);
  'window.indexedDB',
  //    keys = this.openDatabaseKey(keys);
  'window.openDatabase',
  //    keys = this.pluginsKey(keys);
  'navigator.plugins',
  //    keys = this.canvasKey(keys);
  'window.CanvasRenderingContext2D.prototype.rect',
  //    keys = this.webglKey(keys);
  'window.WebGLRenderingContext.prototype.createBuffer',
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
    for (const m of methods) {
      this.wrapMethod(m);
    }

    this.listen(this.firstpartyFingerprintingListener.bind(this));
    this.send({type: 'ready'});
  }

  onFingerPrinting(loc) {
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
  wrapMethod(dottedPropName) {
    const self = this,
      arr = dottedPropName.split('.'),
      propName = arr.pop();

    let baseObj = arr.reduce((o, i) => o[i], this.globalObj);
    const before = baseObj[propName];

    Object.defineProperty(baseObj, propName, {
      get: function() {
        self.addCall(dottedPropName, self.getScriptLocation());
        return before;
      }
    });
  }

  addLocation() {
    return {isFingerprinting: false, counts: {}, nnzCounts: 0};
  }

  /*
   * Keep a running score/nnzCounts. This lets us avoid polling
   * counter.isFingerPrinting.
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
        this.onFingerPrinting(loc_name);
      }
    }

    loc.counts[prop_name] += 1;
    if (loc.isFingerprinting) {
      throw new Error(`Fingerprinting detected on ${loc_name} with proprety ${prop_name}`);
    }
  }
};

// switch on browser vs. node context
if (typeof exports === 'undefined') {
  // get this asap before the script tag is removed
  event_id = document.currentScript.getAttribute('data');

  /* start 'em up */
  const config = {
    globalObj: window,
    methods,
    getScriptLocation,
    threshold,
    send,
    listen,
  };

  const counter = new Counter(config); // eslint-disable-line
} else {
  Object.assign(exports, {Counter});
}

})(typeof exports == 'undefined' ? undefined : exports);
