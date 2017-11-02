"use strict";

(function(exports) {

class MessageListener {
  constructor(messageEmitter, tabs, store) {
    this.onMessageMap = new Map();
    this.messageEmitter = messageEmitter;
    this.tabs = tabs;
    this.store = store;
  }

  onMessage(message, sender) {
    if (this.onMessageMap.has(message.type)) {
      return this.onMessageMap.get(message.type)(message, sender);
    }
  }

  start() {
    this.onMessageMap.set('fingerprinting', this.onFingerPrinting);
    this.messageEmitter.addListener(this.onMessage);
  }

  async onFingerPrinting(message, sender) {

    if (this.tabs.hasResource(
      {
        tabId: sender.tab.id,
        frameId: sender.frameId,
        url: message.url,
        type: 'script'
      })) {
      await this.store.set(message.url, 'block');
    }
  }
}

Object.assign(exports, {MessageListener});

})(typeof exports == 'undefined' ? require.scopes.messages = {} : exports);
