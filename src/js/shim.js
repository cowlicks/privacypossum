"use strict";

(function(exports) {

const {makeTrap, BrowserDisk} = require('./utils'),
  {FakeDisk, FakeMessages, fakeConnects} = require('./fakes');

let url_;
try {
  url_ = URL;
} catch (e) {
  url_ = require('url').URL;
}

let disk_ = {};
try {
  chrome.storage.sync;
  disk_ = new BrowserDisk(chrome.storage.sync);
  disk_.newDisk = () => disk_;
} catch (e) {
  disk_ = FakeDisk;
  disk_.newDisk = () => new FakeDisk();
}

let onMessage_, sendMessage_;
try {
  onMessage_ = chrome.runtime.onMessage;
  sendMessage_ = chrome.runtime.sendMessage;
} catch (e) {
  let fm = new FakeMessages();
  onMessage_ = fm;
  sendMessage_ = fm.sendMessage.bind(fm);
}

let onBeforeRequest;
try {
  onBeforeRequest = chrome.webRequest.onBeforeRequest;
} catch (e) {
  onBeforeRequest = new FakeMessages();
}

let onBeforeSendHeaders;
try {
  onBeforeSendHeaders = chrome.webRequest.onBeforeSendHeaders;
} catch (e) {
  onBeforeSendHeaders = new FakeMessages();
}

let onRemoved;
try {
  onRemoved = chrome.tabs.onRemoved;
} catch (e) {
  onRemoved = new FakeMessages();
}

let setBadgeText, getBadgeText;
try {
  setBadgeText = chrome.browserAction.setBadgeText;
} catch(e) {
  setBadgeText = ({text, tabId}) => {
    setBadgeText.data[tabId] = text;
  };
  setBadgeText.data = {};
  getBadgeText = ({tabId}, callback) => {
    callback(setBadgeText.data[tabId]);
  };
}

let connect, onConnect;
try {
  connect = chrome.runtime.connect;
  onConnect = chrome.runtime.onConnect;
} catch(e) {
  [connect, onConnect] = fakeConnects();
}

let tabsQuery;
try {
  tabsQuery = chrome.tabs.query;
}  catch (e) {
  tabsQuery = (obj, callback) => callback(tabsQuery.tabs);
  tabsQuery.tabs = [];
}

let getDocument;
try {
  document;
  getDocument = () => document;
} catch (e) {
  getDocument = makeTrap();
}

Object.assign(exports, {
  URL: url_,
  Disk: disk_,
  onMessage: onMessage_,
  sendMessage: sendMessage_,
  onBeforeRequest,
  onBeforeSendHeaders,
  onRemoved,
  setBadgeText,
  getBadgeText,
  connect,
  onConnect,
  tabsQuery,
  getDocument,
});

})(typeof exports == 'undefined' ? require.scopes.shim = {} : exports);
