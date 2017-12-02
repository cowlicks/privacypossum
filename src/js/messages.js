"use strict";

[(function(exports) {

const {Action} = require('./schemes'),
  constants = require('./constants'),
  {Reason} = require('./reasons'),
  {URL} = require('./shim');

async function onFingerPrinting({store, tabs}, message, sender) {
  let tabId = sender.tab.id,
    {frameId} = sender,
    {url} = message,
    type = 'script';

  // NB: the url could be dangerous user input, so we check it is an existing resource.
  if (tabs.hasResource({tabId, frameId, url, type})) {
    let reason = constants.FINGERPRINTING,
      response = constants.CANCEL,
      frameUrl = tabs.getFrameUrl(tabId, frameId),
      tabUrl = tabs.getTabUrl(sender.tab.id),
      {href} = new URL(url);

    let action = new Action({response, reason, href, frameUrl, tabUrl});
    tabs.markResponse(response, href, sender.tab.id);
    await store.setDomainPath(href, action);
  }
}

async function onUserUrlDeactivate({store}, {url}, sender) {
  let action = new Action({
    response: constants.NO_ACTION,
    reason: constants.USER_URL_DEACTIVATE,
    href: url});
  await store.setDomainPath(url, action);
}

async function onUserHostDeactivate({store}, {url}, sender) {
  let action = new Action({
    response: constants.NO_ACTION,
    reason: constants.USER_HOST_DEACTIVATE,
    href: url});
  await store.updateDomain(url, (domain) => Object.assign(domain, {action}));
}

const reasons = [
  [constants.USER_URL_DEACTIVATE, onUserUrlDeactivate],
  [constants.USER_HOST_DEACTIVATE, onUserHostDeactivate],
  [constants.FINGERPRINTING, onFingerPrinting],
]


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
