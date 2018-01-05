"use strict";

[(function(exports) {

const shim = require('../shim'),
    {reasons} = require('./reasons');

/* Dispatcher mixin class.
 *
 * it requires you define how to parse the arguments into the dispatch
 * functions to get the `type` and arguments to the function. This is done by
 * parseInput. It should look like:
 *
 * (arguments) => [type, dispatchedArgs];
 */
class Dispatcher {
  constructor(parseInput) {
    Object.assign(this, {parseInput});
    this.funcs = new Map();
  }

  addListener(type, callback) {
    this.funcs.set(type, callback);
  }

  dispatcher() {
    let [type, args] = this.parseInput(arguments);
    if (this.funcs.has(type)) {
      return (this.funcs.get(type)).apply(undefined, args);
    }
  }
}

const mhInputParser = ([messenger, sender]) => [messenger.type, [messenger, sender]];
class MessageHandler extends Dispatcher {
  constructor(tabs, store, reasons_ = reasons) {
    super(mhInputParser);
    this.tabs = tabs;
    this.store = store;
    reasons_.map(this.addReason.bind(this));
  }

  addReason(reason) {
    if (reason.messageHandler) {
      return this.addListener(reason.name, reason.messageHandler.bind(undefined, {store: this.store, tabs: this.tabs}));
    }
  }

  start(onMessage = shim.onMessage) {
    Object.assign(this, {onMessage});
    this.onMessage.addListener(this.dispatcher.bind(this));
  }
}

// todo wrap handler requests to assure main_frame's are not blocked.
const rhInputParser = ([obj, details]) => [obj.action.reason, [details]];
class RequestHandler extends Dispatcher {
  constructor(tabs, store) {
    super(rhInputParser);
    Object.assign(this, {tabs, store});
    this.funcs = new Map();
  }

  handleRequest(obj, details) {
    if (obj.hasOwnProperty('action')) {
      details.action = obj.action;
      this.dispatcher(obj, details);
    }
  }

  addReason(reason) {
    this.addListener(reason.name,
      reason.requestHandler.bind(undefined, {tabs: this.tabs, store: this.store}));
  }
}

const thInputParser = ([{tab, info}]) => [tab.action.reason, [{tab, info}]];
class TabHandler extends Dispatcher {
  constructor(tabs, store) {
    super(thInputParser);
    Object.assign(this, {tabs, store});
  }

  startListeners(onUpdated = shim.onUpdated) {
    onUpdated.addListener(this.handleUpdated.bind(this));
  }

  handleUpdated(tabId, info) {
    if (this.tabs.hasTab(tabId)) {
      let tab = this.tabs.getTab(tabId);
      if (tab.hasOwnProperty('action')) {
        return this.dispatcher({tab, info});
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

    reasons_.map(this.addReason.bind(this));
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
