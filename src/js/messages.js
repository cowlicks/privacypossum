"use strict";

[(function(exports) {

const {Action} = require('./schemes'),
  constants = require('./constants'),
  {Reason} = require('./reasons'),
  {URL} = require('./shim');

// todo remove reason methods here.
class MessageDispatcher {
  constructor(tabs, store) {
    this.tabs = tabs;
    this.store = store;
    this.dispatchMap = new Map();
    reasons.forEach(([name, onMessage]) => this.addReason(new Reason(name, {messageHandler: onMessage})));
  }

  async dispatcher(message, sender) {
    if (this.dispatchMap.has(message.type)) {
        return await (this.dispatchMap.get(message.type))(message, sender);
    }
  }

  addReason(reason) {
    return this.addListener(reason.name, reason.messageHandler.bind(undefined, {store: this.store, tabs: this.tabs}));
  }

  addListener(type, callback) {
    this.dispatchMap.set(type, callback);
  }

  start(onMessage) {
    this.onMessage = onMessage;
    onMessage.addListener(this.dispatcher.bind(this));
  }
}

Object.assign(exports, {MessageDispatcher, onFingerPrinting, onUserUrlDeactivate, onUserHostDeactivate});

})].map(func => typeof exports == 'undefined' ? require.scopes.messages = func : func(exports));
