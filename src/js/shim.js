/**
 * We shim browser API's so our code can be compatible with both Node and the
 * Browser without transpiling stuff.
 */

const exports = {};
/**
 * we load these lazily.
 */

import {FakeMessages, FakeDisk, Connects} from './fakes.js';
import {BrowserDisk} from './utils.js';

function wrapObject(base) {
  let mutableBase = null;
  return new Proxy(base, {
    construct(base, thisArg, argumentList) {
      mutableBase ?? (mutableBase = base);
      return new mutableBase(...argumentsList);
    },
    apply(base, thisArg, argumentsList) {
      mutableBase ?? (mutableBase = base);
      return mutableBase.apply(thisArg, argumentsList);
    },
    get(base, prop, receiver) {
      mutableBase ?? (mutableBase = base);
      const value = mutableBase[prop];
      return typeof value === 'function' ? value.bind(mutableBase) : value;
    },
    set(base, prop, value, receiver) {
      mutableBase ?? (mutableBase = base);
      if (prop === 'setBase') {
        mutableBase = value;
        return true;
      }
      mutableBase[prop] = value;
      return true;
    }
  });
}

let globalObj = (typeof window === 'object') ? window : global; // eslint-disable-line
let getter = (name, obj) => name.split('.').reduce((o, i) => o[i], obj);
let passThru = (x) => x;
let makeFakeMessages = () => {
  return new FakeMessages();
};
let makeFakeSendMessage = () => {
  let fm = makeFakeMessages(),
    sendMessage = fm.sendMessage.bind(fm)
  Object.assign(sendMessage, {clear: fm.clear.bind(fm), onMessage: fm});
  return sendMessage;
}
let makeFakeDisk = () => {
  let out = FakeDisk;
  out.newDisk = () => new FakeDisk();
  return out;
}

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
 * shim for api's that share state; // todo use proxy's for these?
 */
let onAndSendMessage = (name) => {
  let fm = makeFakeMessages();
  assign('onMessage', fm);
  assign('sendMessage', fm.sendMessage.bind(fm));
  return getter(name, exports);
};

let tabsOnAndSendMessage = (name) => {
  let fm = makeFakeMessages();
  assign('tabsOnMessage', fm);
  assign('tabsSendMessage', fm.sendMessage.bind(fm));
  return getter(name, exports);
};

let connectAndOnConnect = (name) => {
  let [con, onCon] = Connects.create();
  assign('onConnect', onCon);
  assign('connect', con);
  return getter(name, exports);
};

// todo wrap these callbacks with promises
// todo DRY these with stuff above
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

let shim = [
  ['onMessage', 'chrome.runtime.onMessage', passThru, onAndSendMessage],
  ['sendMessage', 'chrome.runtime.sendMessage', passThru, onAndSendMessage],
  ['onBeforeRequest', 'chrome.webRequest.onBeforeRequest', passThru, makeFakeMessages],
  ['onBeforeRedirect', 'chrome.webRequest.onBeforeRedirect', passThru, makeFakeMessages],
  ['onBeforeSendHeaders', 'chrome.webRequest.onBeforeSendHeaders', passThru, makeFakeMessages],
  ['onHeadersReceived', 'chrome.webRequest.onHeadersReceived', passThru, makeFakeMessages],
  ['onCompleted', 'chrome.webRequest.onCompleted', passThru, makeFakeMessages],
  ['OnBeforeRequestOptions', 'chrome.webRequest.OnBeforeRequestOptions', passThru, () => {
    return {'BLOCKING': 'blocking'};
  }],
  ['OnBeforeSendHeadersOptions', 'chrome.webRequest.OnBeforeSendHeadersOptions', passThru, () => {
    return {'BLOCKING': 'blocking', 'REQUEST_HEADERS': "requestHeaders"};
  }],
  ['OnHeadersReceivedOptions', 'chrome.webRequest.OnHeadersReceivedOptions', passThru, ()=> {
    return {'BLOCKING': 'blocking', 'RESPONSE_HEADERS': "responseHeaders"};
  }],
  ['onRemoved', 'chrome.tabs.onRemoved', passThru, makeFakeMessages],
  ['onActivated', 'chrome.tabs.onActivated', passThru, makeFakeMessages],
  ['onUpdated', 'chrome.tabs.onUpdated', passThru, makeFakeMessages],
  ['tabsOnMessage', 'chrome.tabs.onMessage', passThru, tabsOnAndSendMessage],
  ['tabsSendMessage', 'chrome.tabs.sendMessage', passThru, tabsOnAndSendMessage],
  ['tabsExecuteScript', 'chrome.tabs.executeScript', passThru, makeFakeSendMessage],
  ['onNavigationCommitted', 'chrome.webNavigation.onCommitted', passThru, makeFakeMessages],
  ['onErrorOccurred', 'chrome.webNavigation.onErrorOccurred', passThru, makeFakeMessages],
  ['getAllFrames', 'chrome.webNavigation.getAllFrames', passThru,
    () => {
      let out = (obj, callback) => callback(out.data);
      out.data = [];
      out.clear = () => out.data = [];
      return out;
    },
  ],
  ['connect', 'chrome.runtime.connect', passThru, connectAndOnConnect],
  ['onConnect', 'chrome.runtime.onConnect', passThru, connectAndOnConnect],
  ['tabsQuery', 'chrome.tabs.query', passThru,
    () => {
      let out = (obj, callback) => callback(out.tabs);
      out.tabs = [];
      out.clear = () => out.tabs = [];
      return out;
    },
  ],
  ['tabsGet', 'chrome.tabs.get', passThru, () => (tabId, callback) => callback(tabId)],
  ['setBadgeText', 'chrome.browserAction.setBadgeText', passThru, setAndGetBadgeText],
  ['getBadgeText', 'chrome.browserAction.getBadgeText', passThru, setAndGetBadgeText],
  ['setIcon', 'chrome.browserAction.setIcon', passThru, () => () => {}],
  ['getURL', 'chrome.extension.getURL', passThru, () => () => {}],
  ['React', 'React', passThru, () => {
    return import('./external/react/react.production.min.js').then(({default: React}) => React);
  }],
  ['ReactDOM', 'ReactDOM', passThru, () => {
    return import('./external/react-dom/react-dom.production.min.js').then(({default: ReactDOM}) => ReactDOM);
  }],
  ['document', 'document', passThru, () => {
    return wrapObject(
      import('jsdom').then(({default: {JSDOM}}) => {
        let mainDoc = (new JSDOM()).window.document;
        return mainDoc;
      }));
  }],
  ['URL', 'URL', () => URL, () => {
    return import('url').then(({URL}) => URL);
  }],
  ['Disk', 'chrome.storage.local',
    () => {
      let out = new BrowserDisk(chrome.storage.local);
      out.newDisk = () => out;
      return out;
    },
    makeFakeDisk,
  ],
];

shim.forEach(shim => shimmer.apply(undefined, shim));

Object.assign(exports, {wrapObject});

export {exports as shim};
