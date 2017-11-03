"use strict";

(function(exports) {

const {Context, updateDomainPath} = require('./schemes'),
  constants = require('./constants'),
  {URL} = require('./shim');

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
    this.onMessageMap.set(constants.FINGERPRINTING, this.onFingerPrinting);
    this.messageEmitter.addListener(this.onMessage);
  }

  async onFingerPrinting(message, sender) {
    let tabId = sender.tab.id,
      {frameId} = sender,
      {url} = message,
      type = 'script';

    if (this.tabs.hasResource({tabId, frameId, url, type})) {
      let reason = constants.FINGERPRINTING,
        frameUrl = this.tabs.getFrameUrl(sender.frameId),
        tabUrl = this.tabs.getTabUrl(sender.tab.id),
        urlObj = new URL(url);

      let ctx = new Context({reason, url, frameUrl, tabUrl});
      await this.store.updateUrl(url, (domain) => {
        return updateDomainPath(domain, urlObj.pathname, constants.CANCEL, ctx)
      });
    }
  }
}

Object.assign(exports, {MessageListener});

})(typeof exports == 'undefined' ? require.scopes.messages = {} : exports);
