"use strict";

[(function(exports) {

const {Action} = require('./schemes'),
  constants = require('./constants'),
  {URL} = require('./shim');

class MessageDispatcher {
  constructor(tabs, store) {
    this.tabs = tabs;
    this.store = store;
    this.defaults = [
      [constants.FINGERPRINTING, this.onFingerPrinting.bind(this)],
      [constants.USER_URL_DEACTIVATE, this.onUserUrlDeactivate.bind(this)],
      [constants.USER_HOST_DEACTIVATE, this.onUserHostDeactivate.bind(this)]
    ];
    this.dispatchMap = new Map(this.defaults);
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

  async onUserUrlDeactivate({url}) {
    let action = new Action({
      response: constants.NO_ACTION,
      reason: constants.USER_URL_DEACTIVATE,
      href: url});
    await this.store.setDomainPath(url, action);
  }

  async onUserHostDeactivate({url}) {
    let action = new Action({
      response: constants.NO_ACTION,
      reason: constants.USER_HOST_DEACTIVATE,
      href: url});
    await this.store.updateDomain(url, (domain) => Object.assign(domain, {action}));
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
