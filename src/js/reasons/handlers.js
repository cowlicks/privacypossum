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
  addReason(args, reason) {
    if (reason[this.name]) {
      args = args ? args : [];
      return this.addListener(reason.name, reason[this.name].bind(this, ...args));
    }
  }
}

class PopupHandler extends Dispatcher {
  constructor(reasons_ = reasons) {
    super(x => x);
    Object.assign(this, {name: 'popupHandler'});
    this.addReason = this.addReason.bind(this, []);
    reasons_.map(this.addReason.bind(this));
  }
}

const mhInputParser = ([messenger, sender]) => [messenger.type, [messenger, sender]];
class MessageHandler extends Dispatcher {
  constructor(tabs, store, reasons_ = reasons) {
    super(mhInputParser);
    Object.assign(this, {tabs, store, name: 'messageHandler'});
    this.addReason = this.addReason.bind(this, [{store, tabs}]),
    reasons_.map(this.addReason.bind(this));
  }

  startListeners(onMessage = shim.onMessage) {
    Object.assign(this, {onMessage});
    this.onMessage.addListener(this.dispatcher.bind(this));
  }
}

// todo wrap handler requests to assure main_frame's are not blocked.
const rhInputParser = ([obj, details]) => [obj.action.reason, [details]];
class RequestHandler extends Dispatcher {
  constructor(tabs, store) {
    super(rhInputParser);
    Object.assign(this, {tabs, store, name: 'requestHandler'});
    this.addReason = this.addReason.bind(this, [{store, tabs}]);
  }

  handleRequest(obj, details) {
    if (obj.hasOwnProperty('action')) {
      details.action = obj.action;
      this.dispatcher(obj, details);
    }
  }
}

const thInputParser = ([{tab, info}]) => [tab.action.reason, [{tab, info}]];
class TabHandler extends Dispatcher {
  constructor(tabs, store) {
    super(thInputParser);
    Object.assign(this, {tabs, store, name: 'tabHandler'});
    this.addReason = this.addReason.bind(this, [{store, tabs}]);
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
    this.requestHandler.addReason(reason);
    this.tabHandler.addReason(reason);
    if (reason.in_popup) {
      this.inPopupSet.add(reason.name);
    }
  }
}

Object.assign(exports, {PopupHandler, MessageHandler, RequestHandler, TabHandler, Handler});

})].map(func => typeof exports == 'undefined' ? define('/reasons/handlers', func) : func(exports));
