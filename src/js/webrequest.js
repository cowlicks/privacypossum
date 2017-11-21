"use strict";

(function(exports) {

const {URL} = require('./shim'),
  constants = require('./constants');

// check if hostname has the given basename
function isBaseOfHostname(base, host) {
  return host.endsWith(base) ?
    (base.length === host.length || host.substr(-base.length - 1, 1) === '.') :
    false;
}

class WebRequest {
  constructor(tabs, store) {
    this.tabs = tabs;
    this.store = store;
  }

  isThirdParty(details) {
    let basename = this.tabs.getBaseDomain(details.tabId);
    if (basename) {
      return !isBaseOfHostname(basename, details.urlObj.hostname);
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

  markAction(action, {url, tabId}) {
    this.tabs.markAction(action, url, tabId);
  }

  commitRequest(details) {
    let action = constants.NO_ACTION,
      {hostname, pathname} = details.urlObj;

    if (details.type === constants.TYPES.main_frame) {
      return action;
    }

    if (this.store.has(hostname)) {
      action = this.store.get(hostname).getAction(pathname);
      this.markAction(action, details);
    }
    return action;
  }

  onBeforeRequest(details) {
    details.urlObj = new URL(details.url);
    this.recordRequest(details);
    return this.commitRequest(details);
  }

  onBeforeSendHeaders(details) {
    let action = constants.NO_ACTION;
    details.urlObj = new URL(details.url);

    if (this.isThirdParty(details)) {
      if (removeCookies(details.requestHeaders)) {
        action = {requestHeaders: details.requestHeaders};
      }
    }
    return action;
  }
}

const badHeaders = new Set(['cookie', 'referer', 'set-cookie']);

function removeCookies(headers) {
  let mutated = false;
  for (let i = 0; i < headers.length; i++) {
    while (i < headers.length && badHeaders.has(headers[i].name.toLowerCase())) {
      headers.splice(i, 1);
      mutated = true;
    }
  }
  return mutated;
}

Object.assign(exports, {WebRequest, removeCookies});

})(typeof exports == 'undefined' ? require.scopes.webrequest = {} : exports);
