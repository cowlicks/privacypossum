"use strict";

[(function(exports) {

const shim = require('./shim'), {URL} = shim,
  constants = require('./constants'),
  {header_methods, request_methods} = constants,
  {ON_BEFORE_REQUEST, ON_BEFORE_SEND_HEADERS, ON_HEADERS_RECEIVED} = request_methods,
  {Handler} = require('./reasons/handlers');

function annotateDetails(details, requestType) {
  return Object.assign(details, {
    requestType,
    headerPropName: header_methods.get(requestType),
    urlObj: new URL(details.url),
    response: constants.NO_ACTION,
  });
}

class WebRequest {
  constructor(tabs, store, handler = new Handler(tabs, store)) {
    Object.assign(this, {tabs, store, handler});
    this.checkRequestAction = this.handler.handleRequest.bind(this.handler);
    this.removeHeaders = this.handler.removeHeaders.bind(this.handler);
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

  isThirdParty(details) {
    // cache isThirdParty status per details and requestId
    return this.tabs.isRequestThirdParty(details);
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
    annotateDetails(details, ON_BEFORE_REQUEST);
    this.recordRequest(details);
    return this.commitRequest(details);
  }

  onBeforeSendHeaders(details) {
    annotateDetails(details, ON_BEFORE_SEND_HEADERS);
    this.headerHandler(details);
    this.markAction(details);
    return details.response;
  }

  onHeadersReceived(details) {
    annotateDetails(details, ON_HEADERS_RECEIVED);
    this.headerHandler(details);
    this.markAction(details);
    return details.response;
  }

  requestOrResponseAction(details) {
    if (!details.shortCircuit) {
      if (details.requestType == ON_HEADERS_RECEIVED) {
        return this.handler.headerHandler.referer.onHeadersReceived(details);
      }
    }
  }

  headerHandler(details) {
    if (this.isThirdParty(details)) {
      let headers = details[details.headerPropName],
        removed = this.removeHeaders(details, headers);
      this.checkAllRequestActions(details);
      this.requestOrResponseAction(details);
      if (!details.shortCircuit && (removed.length || headers.mutated)) {
        details.response = {[details.headerPropName]: headers};
        this.markHeaders(removed, details);
      }
    }
    return details.response;
  }
}

Object.assign(exports, {WebRequest, annotateDetails});

})].map(func => typeof exports == 'undefined' ? define('/webrequest', func) : func(exports));
