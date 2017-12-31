"use strict";

[(function(exports) {

const {onUpdated} = require('../shim'),
    {reasons} = require('./reasons');

// todo wrap handler requests to assure main_frame's are not blocked.
// todo make a handler mixin
class RequestHandler {
  constructor(tabs, store) {
    Object.assign(this, {tabs, store});
    this.funcs = new Map();
  }

  handleRequest(obj, details) {
    if (obj.hasOwnProperty('action')) {
      details.action = obj.action;
      this.funcs.get(obj.action.reason)(details);
    }
  }

  addReason(reason) {
    this.funcs.set(reason.name,
      reason.requestHandler.bind(undefined, {tabs: this.tabs, store: this.store}));
  }
}

class TabHandler {
  constructor(tabs, store) {
    Object.assign(this, {tabs, store});
    this.funcs = new Map();
  }

  startListeners() {
    onUpdated.addListener(this.handleUpdated.bind(this));
  }

  handleUpdated(tabId, info) {
    if (this.tabs.hasTab(tabId)) {
      let tab = this.tabs.getTab(tabId);
      if (tab.hasOwnProperty('action')) {
        return this.funcs.get(tab.action.reason)({tab, info});
      }
    }
  }

  addReason(reason) {
    this.funcs.set(reason.name,
      reason.tabHandler.bind(undefined, {tabs: this.tabs, store: this.store}));
  }
}


class Handler {
  constructor(tabs, store, reasons_ = reasons) {
    this.requestHandler = new RequestHandler(tabs, store);
    this.handleRequest = this.requestHandler.handleRequest.bind(this.requestHandler);

    this.tabHandler = new TabHandler(tabs, store);
    this.tabHandler.startListeners();
    this.inPopupSet = new Set();

    reasons_.forEach(reason => {
      this.addReason(reason);
    });
  }

  isInPopup(reasonName) {
    return this.inPopupSet.has(reasonName);
  }

  addReason(reason) {
    if (reason.requestHandler) {
      this.requestHandler.addReason(reason);
    }
    if (reason.tabHandler) {
      this.tabHandler.addReason(reason);
    }
    if (reason.in_popup) {
      this.inPopupSet.add(reason.name);
    }
  }
}

Object.assign(exports, {RequestHandler, TabHandler, Handler});

})].map(func => typeof exports == 'undefined' ? define('/reasons/handlers', func) : func(exports));
