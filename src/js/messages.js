"use strict";

[(function(exports) {

const {Action} = require('./schemes'),
  constants = require('./constants'),
  {URL} = require('./shim');

class MessageDispatcher {
  constructor(tabs, store) {
    this.defaults = [[constants.FINGERPRINTING, this.onFingerPrinting.bind(this)]];
    this.dispatchMap = new Map(this.defaults);
    this.tabs = tabs;
    this.store = store;
  }

  async dispatcher(message, sender) {
    if (this.dispatchMap.has(message.type)) {
      return await (this.dispatchMap.get(message.type))(message, sender);
    }
  }

  addListener(type, callback) {
    this.dispatchMap.set(type, callback);
  }

  start(onMessage) {
    this.onMessage = onMessage;
    onMessage.addListener(this.dispatcher.bind(this));
  }

  async onFingerPrinting(message, sender) {
    let tabId = sender.tab.id,
      {frameId} = sender,
      {url} = message,
      type = 'script';

    // NB: the url could be dangerous user input, so we check it is an existing resource.
    if (this.tabs.hasResource({tabId, frameId, url, type})) {
      let reason = constants.FINGERPRINTING,
        response = constants.CANCEL,
        frameUrl = this.tabs.getFrameUrl(tabId, frameId),
        tabUrl = this.tabs.getTabUrl(sender.tab.id),
        {href} = new URL(url);

      let action = new Action({response, reason, href, frameUrl, tabUrl});
      this.tabs.markResponse(response, href, sender.tab.id);
      await this.store.setDomainPath(href, action);
    }
  }
}

Object.assign(exports, {MessageDispatcher});

})].map(func => typeof exports == 'undefined' ? require.scopes.messages = func : func(exports));
