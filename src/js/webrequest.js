"use strict";

[(function(exports) {

const {URL} = require('./shim'),
  constants = require('./constants'),
  {Handler} = require('./reasons');

// check if hostname has the given basename
function isBaseOfHostname(base, host) {
  return host.endsWith(base) ?
    (base.length === host.length || host.substr(-base.length - 1, 1) === '.') :
    false;
}

class WebRequest {
  constructor(tabs, store) {
    this.handler = new Handler(tabs);
    this.handleRequest = this.handler.handleRequest.bind(this.handler);
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
    if (response !== constants.NO_ACTION) {
      return this.tabs.markResponse(response, url, tabId);
    }
  }

  commitRequest(details) {
    let {tabId} = details,
      {hostname, pathname} = details.urlObj;
    details.response = constants.NO_ACTION;

    // we check actions in tab -> domain -> path
    this.handleRequest(this.tabs.getTab(tabId), details);
    if (!details.shortCircuit && this.store.has(hostname)) {
      let domain = this.store.get(hostname);
      this.handleRequest(domain, details);
      if (!details.shortCircuit && domain.hasPath(pathname)) {
        let path = domain.getPath(pathname);
        this.handleRequest(path, details);
      }
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
