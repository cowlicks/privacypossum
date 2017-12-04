/**
 * We shim browser API's so our code can be compatible with both Node and the
 * Browser without transpiling stuff.
 */
"use strict";

[(function(exports) {

/**
 * we load these lazily.
 */

let globalObj = (typeof window === 'object') ? window : global; // eslint-disable-line
let getter = (name, obj) => name.split('.').reduce((o, i) => o[i], obj);
let passThru = (x) => x;
let makeFakeMessages = () => {
  let {FakeMessages} = require('./fakes');
  return new FakeMessages();
};

function assign(name, definition) {
  return Object.defineProperty(exports, name, {
    get: function() {
      return definition;
    }
  });
}

function lazyDef(base, name, define) {
  Object.defineProperty(base, name, {
    configurable: true,
    get: function() {
      let out = define();
      Object.defineProperty(base, name, {
        get: function() {
          return out;
        }
      });
      return out;
    }
  });
}

function shimmer(out_name, real_name, onSuccess, onFail) {
  lazyDef(exports, out_name, () => {
    let out;
    try {
      out = getter(real_name, globalObj);
      out = (typeof out !== 'undefined') ? onSuccess(out) : onFail(out_name);
    } catch(e) {
      out = onFail(out_name);
    }
    return out;
  });
}

/**
 * shims for api's that share state;
 */
let onAndSendMessage = (name) => {
  let fm = makeFakeMessages();
  assign('onMessage', fm);
  assign('sendMessage', fm.sendMessage.bind(fm));
  return getter(name, exports);
};

let connectAndOnConnect = (name) => {
  let [con, onCon] = require('./fakes').fakeConnects();
  assign('onConnect', onCon);
  assign('connect', con);
  return getter(name, exports);
};

let setAndGetBadgeText = (name) => {
  let setBadgeText = ({text, tabId}) => {
    setBadgeText.data[tabId] = text;
  };
  setBadgeText.data = {};
  let getBadgeText = ({tabId}, callback) => {
    callback(setBadgeText.data[tabId]);
  };
  assign('setBadgeText', setBadgeText);
  assign('getBadgeText', getBadgeText);
  return getter(name, exports);
}

let shims = [
  ['URL', 'URL', () => URL, () => require('url').URL],
  ['Disk', 'chrome.storage.sync',
    () => {
      let {BrowserDisk} = require('./utils');
      let out = new BrowserDisk(chrome.storage.sync);
      out.newDisk = () => out;
      return out;
    },
    () => {
      let {FakeDisk} = require('./fakes');
      let out = FakeDisk;
      out.newDisk = () => new FakeDisk();
      return out;
    },
  ],
  ['onMessage', 'chrome.runtime.onMessage', passThru, onAndSendMessage],
  ['sendMessage', 'chrome.runtime.sendMessage', passThru, onAndSendMessage],
  ['onBeforeRequest', 'chrome.webRequest.onBeforeRequest', passThru, makeFakeMessages],
  ['onBeforeSendHeaders', 'chrome.webRequest.onBeforeSendHeaders', passThru, makeFakeMessages],
  ['onHeadersReceived', 'chrome.webRequest.onHeadersReceived', passThru, makeFakeMessages],
  ['onRemoved', 'chrome.tabs.onRemoved', passThru, makeFakeMessages],
  ['connect', 'chrome.runtime.connect', passThru, connectAndOnConnect],
  ['onConnect', 'chrome.runtime.onConnect', passThru, connectAndOnConnect],
  ['getDocument', 'document', () => () => document, () => require('./utils').makeTrap()],
  ['tabsQuery', 'chrome.tabs.query', passThru,
    () => {
      let out = (obj, callback) => callback(out.tabs);
      out.tabs = [];
      return out;
    },
  ],
  ['setBadgeText', 'chrome.browserAction.setBadgeText', passThru, setAndGetBadgeText],
  ['getBadgeText', 'chrome.browserAction.getBadgeText', passThru, setAndGetBadgeText],
];

shims.forEach(shim => shimmer.apply(undefined, shim));

})].map(func => typeof exports == 'undefined' ? require.scopes.shim = func : func(exports));
