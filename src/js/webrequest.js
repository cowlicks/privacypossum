"use strict";

[(function(exports) {

const shim = require('./shim'), {URL} = shim,
  constants = require('./constants'),
  {header_methods, request_methods} = constants,
  {isThirdParty} = require('./domains/parties'),
  {Handler} = require('./reasons/handlers');

function annotateDetails(details, requestType) {
  return Object.assign(details, {
    requestType,
    headerPropName: header_methods.get(requestType),
    urlObj: new URL(details.url),
    response: constants.NO_ACTION,
  });
}

// takes an annoted `details` object
function isThirdPartyForNoTab({initiator, urlObj: {hostname}}) {
  if (typeof initiator !== 'undefined') {
    let initiatorHostname = (new URL(initiator)).hostname;
    return isThirdParty(initiatorHostname, hostname);
  }
  return false; // no associated tab, so 3rd party isn't applicable
}

class WebRequest {
  constructor(tabs, store, handler = new Handler(tabs, store)) {
    Object.assign(this, {tabs, store, handler});
    this.checkRequestAction = this.handler.handleRequest.bind(this.handler);
  }

  isThirdParty(details) {
    if (details.tabId === -1) {
      return isThirdPartyForNoTab(details);
    }
    return this.tabs.isThirdParty(details.tabId, details.urlObj.hostname);
  }

  startListeners({onBeforeRequest, onBeforeSendHeaders, onHeadersReceived} = shim) {
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

  markHeaders(removed, {tabId}) {
    return this.tabs.markHeaders(removed, tabId);
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
    this.checkAllRequestActions(details);
    this.markAction(details);  // record new behavior
    return details.response;
  }

  onBeforeRequest(details) {
    annotateDetails(details, request_methods.ON_BEFORE_REQUEST);
    this.recordRequest(details);
    return this.commitRequest(details);
  }

  onBeforeSendHeaders(details) {
    annotateDetails(details, request_methods.ON_BEFORE_SEND_HEADERS);
    return this.headerHandler(details);
  }

  onHeadersReceived(details) {
    annotateDetails(details, request_methods.ON_HEADERS_RECEIVED);
    return this.headerHandler(details);
  }

  headerHandler(details) {
    if (this.isThirdParty(details)) {
      let headers = details[details.headerPropName],
        removed = removeHeaders(headers);
      this.checkAllRequestActions(details);
      if (!details.shortCircuit && removed.length) {
        details.response = {[details.headerPropName]: headers};
        this.markHeaders(removed, details);
      }
    }
    return details.response;
  }
}

const badHeaders = new Set(['cookie', 'referer', 'set-cookie']);

// return number of headers mutated
// todo, attach response to details object?
// todo rename to removeBadHeaders?
function removeHeaders(headers) {
  let removed = [];
  for (let i = 0; i < headers.length; i++) {
    while (i < headers.length && badHeaders.has(headers[i].name.toLowerCase())) {
      removed.push(...headers.splice(i, 1));
    }
  }
  return removed;
}

Object.assign(exports, {WebRequest, removeHeaders, annotateDetails});

})].map(func => typeof exports == 'undefined' ? define('/webrequest', func) : func(exports));
