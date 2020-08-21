import {shim} from '../shim.js';
import  {HeaderHandler} from './headers.js';
import  {Reasons, reasonsArray} from './reasons.js';


/*
 * Handler superclass
 * holds functions and dispatches them
 *
 */
class Dispatcher {
  constructor(name, dependencies, reasons) {
    Object.assign(this, {name, reasons});
    Object.assign(this, dependencies);
    this.funcs = new Map();
    this.info = new Map();

    this.addReason = this.addReason.bind(this, [dependencies]);
    this.reasons.map(this.addReason.bind(this));
  }

  dispatcher(type, args) {
    if (this.funcs.has(type)) {
      return (this.funcs.get(type)).apply(undefined, args);
    }
  }

  // same as dispatcher but returns the function with bound arguments.
  getFunc() {
    return this.dispatcher.bind(this, ...arguments);
  }

  addReason(args, reason) {
    if (reason[this.name]) {
      args = args ? args : [];
      return this.addListener(reason.name, reason[this.name].bind(this, ...args));
    }
  }
  addListener(name, func) {
    return this.funcs.set(name, func);
  }
}

class PopupHandler extends Dispatcher {
  constructor(reasons = Reasons.fromArray(reasonsArray)) {
    super('popupHandler', {}, reasons); // no tabs or store in popup
  }
  isInPopup(reasonName) {
    return this.funcs.has(reasonName);
  }
  getInfo(reasonName) {
    if (this.info.has(reasonName)) {
      return this.info.get(reasonName);
    }
    return {
      icon: '/media/block-icon.png',
      attribution: "CCBY ProSymbols, US",
    };
  }
  addReason(args, reason) {
    let {name, popup_info} = reason;
    super.addReason(args, reason);
    if (popup_info) {
      this.info.set(name, popup_info);
    }
  }
}

class MessageHandler extends Dispatcher {
  constructor(tabs, store, reasons = Reasons.fromArray(reasonsArray)) {
    super('messageHandler', {tabs, store}, reasons);
  }

  dispatcher(messenger, sender, sendResponse) {
    return super.dispatcher(messenger.type, [messenger, sender, sendResponse]);
  }

  startListeners(onMessage = shim.onMessage) {
    Object.assign(this, {onMessage});
    this.onMessage.addListener(this.dispatcher.bind(this));
  }
}

// todo wrap handler requests to assure main_frame's are not blocked.
class RequestHandler extends Dispatcher {
  constructor(tabs, store, reasons) {
    super('requestHandler', {tabs, store}, reasons);
  }

  dispatcher(obj, details) {
    return super.dispatcher(obj.action.reason, [details]);
  }

  handleRequest(obj, details) {
    if (obj.hasOwnProperty('action')) {
      details.action = obj.action;
      this.dispatcher(obj, details);
    }
  }
}

class TabHandler extends Dispatcher {
  constructor(tabs, store, reasons) {
    super('tabHandler', {tabs, store}, reasons);
  }

  startListeners(onUpdated = shim.onUpdated) {
    onUpdated.addListener(this.handleUpdated.bind(this));
  }

  dispatcher({tab, info}) {
    return super.dispatcher(tab.action.reason, [{tab, info}]);
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
  constructor(tabs, store, reasons = Reasons.fromArray(reasonsArray)) {
    this.reasons = reasons;
    this.requestHandler = new RequestHandler(tabs, store, reasons);
    this.handleRequest = this.requestHandler.handleRequest.bind(this.requestHandler);
    this.headerHandler = new HeaderHandler(store);
    this.removeHeaders = this.headerHandler.removeHeaders.bind(this.headerHandler);

    this.tabHandler = new TabHandler(tabs, store, reasons);
    this.tabHandler.startListeners();

    this.popupHandler = new PopupHandler(reasons);
    this.isInPopup = this.popupHandler.isInPopup.bind(this.popupHandler);
  }
  addReason(name, reason) {
    this.requestHandler.addReason(name, reason);
    this.tabHandler.addReason(name, reason);
    this.popupHandler.addReason(name, reason);
  }
}

export {PopupHandler, MessageHandler, RequestHandler, TabHandler, Handler};
