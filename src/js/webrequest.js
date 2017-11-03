"use strict";

(function(exports) {

const {URL} = require('./shim'),
  constants = require('./constants');

class WebRequest {
  constructor(tabs, store) {
    this.tabs = tabs;
    this.store = store;
  }

  start(onBeforeRequest) {
    onBeforeRequest.addListener(this.onBeforeRequest.bind(this), {urls: ["<all_urls>"]}, ["blocking"]);
  }

  recordRequest(details) {
    this.tabs.addResource(details);
  }

  commitRequest(details) {
    let action = constants.NO_ACTION,
      url = new URL(details.url);

    if (this.store.has(url.hostname)) {
      action = this.store.get(url.hostname).getAction(url.pathname);
    }
    return action;
  }

  onBeforeRequest(details) {
    this.recordRequest(details);
    return this.commitRequest(details);
  }
}

Object.assign(exports, {WebRequest});

})(typeof exports == 'undefined' ? require.scopes.webrequest = {} : exports);
