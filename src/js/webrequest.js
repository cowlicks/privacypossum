"use strict";

[(function(exports) {

const {URL} = require('./shim'),
  constants = require('./constants'),
  {Handler} = require('./reasons/handlers');

class WebRequest {
  constructor(tabs, store) {
    this.handler = new Handler(tabs, store);
    this.checkRequestAction = this.handler.handleRequest.bind(this.handler);
    this.tabs = tabs;
    this.store = store;
  }

  isThirdParty(details) {
    if (details.tabId < -1) {
      return false; // no associated tab, so 3rd party isn't applicable
    }
    return this.tabs.isThirdParty(details.tabId, details.urlObj.hostname);
  }

  start(onBeforeRequest, onBeforeSendHeaders, onHeadersReceived) {
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

    onHeadersReceived.addListener(
      this.onHeadersReceived.bind(this),
      {urls: ["<all_urls>"]},
      ["blocking", "responseHeaders"]
    );
  }

  recordRequest(details) {
    this.tabs.addResource(details);
  }

  markAction({action, url, tabId}) {
    if (action && this.handler.isInPopup(action.reason)) {
      return this.tabs.markAction(action, url, tabId);
    }
  }

  checkAllRequestActions(details) {
    let {tabId} = details,
      {hostname, pathname} = details.urlObj;

    // we check actions in tab -> domain -> path
    this.checkRequestAction(this.tabs.getTab(tabId), details);
    if (!details.shortCircuit && this.store.has(hostname)) {
      let domain = this.store.get(hostname);
      this.checkRequestAction(domain, details);
      if (!details.shortCircuit && domain.hasPath(pathname)) {
        let path = domain.getPath(pathname);
        this.checkRequestAction(path, details);
      }
    }
  }

  commitRequest(details) {
    details.response = constants.NO_ACTION;
    this.checkAllRequestActions(details);
    this.markAction(details);  // record new behavior
    return details.response;
  }

  onBeforeRequest(details) {
    details.urlObj = new URL(details.url);
    this.recordRequest(details);
    return this.commitRequest(details);
  }

  onBeforeSendHeaders(details) {
    return this.headerHandler(details, 'requestHeaders');
  }

  onHeadersReceived(details) {
    return this.headerHandler(details, 'responseHeaders');
  }

  headerHandler(details, headerPropName) {
    details.response = constants.NO_ACTION;
    details.urlObj = new URL(details.url);

    if (this.isThirdParty(details)) {
      let headers = details[headerPropName];
      this.checkAllRequestActions(details);
      if (!details.shortCircuit && removeCookies(headers)) {
        details.response = {[headerPropName]: headers};
      }
    }
    return details.response;
  }
}

const badHeaders = new Set(['cookie', 'referer', 'set-cookie']);

// return true if headers are mutated, otherwise false
// todo, attach response to details object?
// todo rename to removeBadHeaders?
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

})].map(func => typeof exports == 'undefined' ? define('/webrequest', func) : func(exports));
