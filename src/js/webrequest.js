"use strict";

(function(exports) {

const {URL} = require('./shim'),
  constants = require('./constants');

class WebRequest {
  constructor(tabs, store) {
    this.tabs = tabs;
    this.store = store;
  }

  isThirdParty(details) {
    let host = new URL(details.url).hostname,
      taburl = this.tabs.getTabUrl(details.tabId);
    if (taburl) {
      let tabhost = new URL(taburl).hostname;
      return host.endsWith(tabhost) ?
        (tabhost.length === host.length || host.substr(-tabhost.length - 1, 1) === '.') :
        false;
    }
    return false;
  }

  start(onBeforeRequest, onBeforeSendHeaders) {
    onBeforeRequest.addListener(
      this.onBeforeRequest.bind(this),
      {urls: ["<all_urls>"]},
      ["blocking"]
    );

    onBeforeSendHeaders.addListener(
      this.onBeforeSendHeaders.bind(this),
      {urls: ["<all_urls>"]},
      ["blocking", "requestHeaders"]
    );
  }

  recordRequest(details) {
    this.tabs.addResource(details);
  }

  commitRequest(details) {
    let action = constants.NO_ACTION,
      url = new URL(details.url);

    if (details.type === constants.TYPES.main_frame) {
      return action;
    }

    if (this.store.has(url.hostname)) {
      action = this.store.get(url.hostname).getAction(url.pathname);
    }
    return action;
  }

  onBeforeRequest(details) {
    this.recordRequest(details);
    return this.commitRequest(details);
  }

  onBeforeSendHeaders(details) {
    let action = constants.NO_ACTION;

    if (!this.isThirdParty(details)) {
      if (removeCookies(details.requestHeaders)) {
        action = {requestHeaders: details.requestHeaders};
      }
    }
    return action;
  }
}

function removeCookies(headers) {
  let mutated = false
  for (let i = 0; i < headers.length; i++) {
    while (i < headers.length && headers[i].name.toLowerCase() === "cookie") {
      headers.splice(i, 1);
      mutated = true;
    }
  }
  return mutated;
}

Object.assign(exports, {WebRequest, removeCookies});

})(typeof exports == 'undefined' ? require.scopes.webrequest = {} : exports);
