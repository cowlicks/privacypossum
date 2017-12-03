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
 * todo: better name than "method"?
 *
 * # thoughts for a metric over the counts:
 * We can think about each finger printing method a dimension in N dimensional
 * space. Then we can think about this as a metric on an N dimensional vector.
 * where each fingerprinting method maps to an element of this vector.
 *
 * A first naive metric can be the count of all elements of the vector that are
 * non-zero. The higher the metric, the more likely the fingerprinting.
 *
 * Later to improve the metric, we can add weights to each dimension, and
 * consider the number of times each function is called.
 *
 * Hopefully this will work okay, it kinda assumes the dimensions are linearly
 * independent. This certainly isn't true. Once we have more data, we can
 * empirically determine a transformation function that would account for
 * non-independence.
 *
 * test sites found with: https://publicwww.com/websites/%22fingerprint2.min.js%22/
 *
 * ryanair.com  # interesting 0.8 result
 * biggo.com.tw
 * https://www.sitejabber.com/
 * http://www.gettvstreamnow.com/ 0.95
 * https://adsbackend.com/  # is this broken? lol
 *
 * it seems like 0.8 is the minimum for sites using fpjs2,
 * 0.45 is the max I've seen (from github). So I set the threshold
 * at 0.75 for now.
 *
 * this site is loading from augur.io (I think?) and scoring 0.85.
 * http://www.dixipay.com/
 */

const threshold = 0.75;
let event_id;

function onFingerPrinting(loc) {
  document.dispatchEvent(new CustomEvent(event_id, {
    detail: {type: 'fingerprinting', url: loc},
  }));
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
  constructor({globalObj, methods, getScriptLocation, onFingerPrinting, threshold}) {
    this.globalObj = globalObj;
    this.methods = methods;
    this.getScriptLocation = getScriptLocation
    this.onFingerPrinting = onFingerPrinting;
    this.threshold = threshold;

    this.locations = {};
    this.nMethods = methods.length;
    this.isFingerprinting = false;
    for (const m of methods) {
      this.wrapMethod(m);
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
        try {
          self.addCall(dottedPropName, self.getScriptLocation());
        } finally {
          return before;
        }
      }
    });
  }

  addLocation() {
    const out = {counts: {}, nnzCounts: 0};
    return out;
  }

  /*
   * Keep a running score/nnzCounts. This lets us avoid polling
   * counter.isFingerPrinting.
   */
  addCall(name, loc_name) {
    if (!loc_name) {
      return;
    }

    let loc = this.locations[loc_name];
    if (!loc) {
      loc = this.locations[loc_name] = this.addLocation();
    }

    if (!loc.counts.hasOwnProperty(name)) {
      loc.counts[name] = 0;
      loc.nnzCounts += 1;
      if ((loc.nnzCounts/this.nMethods) > this.threshold &&
          (!this.isFingerprinting)) {
        this.isFingerprinting = true;
        this.onFingerPrinting(loc_name);
      }
    }
    loc.counts[name] += 1;
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
    onFingerPrinting,
    threshold
  };

  const counter = new Counter(config); // eslint-disable-line
} else {
  Object.assign(exports, {Counter});
}

})(typeof exports == 'undefined' ? undefined : exports);
