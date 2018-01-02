"use strict";

[(function(exports) {

const shim = require('../shim'),
    {reasons} = require('./reasons');

class MessageHandler {
  constructor(tabs, store, reasons_ = reasons) {
    this.tabs = tabs;
    this.store = store;
    this.dispatchMap = new Map();
    reasons_.map(this.addReason.bind(this));
  }

  async dispatcher(message, sender) {
    if (this.dispatchMap.has(message.type)) {
        return await (this.dispatchMap.get(message.type))(message, sender);
    }
  }

  addReason(reason) {
    if (reason.messageHandler) {
      return this.addListener(reason.name, reason.messageHandler.bind(undefined, {store: this.store, tabs: this.tabs}));
    }
  }

  addListener(type, callback) {
    this.dispatchMap.set(type, callback);
  }

  start(onMessage = shim.onMessage) {
    Object.assign(this, {onMessage});
    this.onMessage.addListener(this.dispatcher.bind(this));
  }
}

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

  startListeners(onUpdated = shim.onUpdated) {
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

Object.assign(exports, {MessageHandler, RequestHandler, TabHandler, Handler});

})].map(func => typeof exports == 'undefined' ? define('/reasons/handlers', func) : func(exports));
