"use strict";

[(function(exports) {

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

  markResponse({response, url, tabId}) {
    this.tabs.markResponse(response, url, tabId);
  }

  commitRequest(details) {
    let {hostname, pathname} = details.urlObj;
    details.response = constants.NO_ACTION;

    // short circuit
    if (details.type === constants.TYPES.main_frame) {
      return details.response;
    }

    if (this.store.has(hostname)) {
      details.response = this.store.get(hostname).getResponse(pathname);
    }

    this.markResponse(details);
    return details.response;
  }

  onBeforeRequest(details) {
    details.urlObj = new URL(details.url);
    this.recordRequest(details);
    return this.commitRequest(details);
  }

  onBeforeSendHeaders(details) {
    let response = constants.NO_ACTION;
    details.urlObj = new URL(details.url);

    if (this.isThirdParty(details)) {
      if (removeCookies(details.requestHeaders)) {
        response = {requestHeaders: details.requestHeaders};
      }
    }
    return response;
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

})].map(func => typeof exports == 'undefined' ? require.scopes.webrequest = func : func(exports));
