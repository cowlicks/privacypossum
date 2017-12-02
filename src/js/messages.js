"use strict";

[(function(exports) {

const {reasons} = require('./reasons');

// todo remove reason methods here.
class MessageDispatcher {
  constructor(tabs, store) {
    this.tabs = tabs;
    this.store = store;
    this.dispatchMap = new Map();
    reasons.forEach(reason => this.addReason(reason));
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

  start(onMessage) {
    this.onMessage = onMessage;
    onMessage.addListener(this.dispatcher.bind(this));
  }
}

Object.assign(exports, {MessageDispatcher});

})].map(func => typeof exports == 'undefined' ? require.scopes.messages = func : func(exports));
