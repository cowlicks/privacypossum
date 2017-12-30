"use strict";

[(function(exports) {

const {Action} = require('../schemes'),
  {URL, tabsSendMessage} = require('../shim'),
  {setTabIconActive, hasAction} = require('../utils'),
  constants = require('../constants');

const {NO_ACTION, CANCEL, FINGERPRINTING, USER_URL_DEACTIVATE,
    USER_HOST_DEACTIVATE, TAB_DEACTIVATE} = constants;

function setResponse(response, shortCircuit) {
  return ({}, details) => Object.assign(details, {response, shortCircuit});
}

/**
 * `name` is the string name of this reasons, see constants.reasons.*
 * `messageHandler` function with signature ({store, tabs}, message, sender)
 * `requestHandler` function with signature ({store, tabs}, details)
 */
class Reason {
  constructor(name, {messageHandler, requestHandler, tabHandler, count_on_badge}) {
    Object.assign(this, {name, messageHandler, requestHandler, tabHandler, count_on_badge});
  }
}

const tabDeactivate = new Action({reason: TAB_DEACTIVATE});

function fingerPrintingRequestHandler({tabs}, details) {
  if (tabs.isThirdParty(details.tabId, details.urlObj.hostname)) {
    Object.assign(details, {response: CANCEL, shortCircuit: false});
  } else {
    // send set fp signal
    let {tabId, frameId} = details;
    tabs.markAction(CANCEL, details.url, details.tabId);
    tabsSendMessage(tabId, {type: 'firstparty-fingerprinting', url: details.url}, {frameId});
  }
}

async function onFingerPrinting({store, tabs}, message, sender) {
  let tabId = sender.tab.id,
    {frameId} = sender,
    {url} = message,
    type = 'script';

  // NB: the url could be dangerous user input, so we check it is an existing resource.
  if (tabs.hasResource({tabId, frameId, url, type})) {
    let reason = constants.FINGERPRINTING,
      frameUrl = tabs.getFrameUrl(tabId, frameId),
      tabUrl = tabs.getTabUrl(sender.tab.id),
      {href} = new URL(url);

    let action = new Action({reason, href, frameUrl, tabUrl});
    tabs.markAction(CANCEL, href, sender.tab.id);
    await store.setDomainPath(href, action);
  }
}

async function onUserUrlDeactivate({store}, {url}) {
  let action = new Action({
    reason: constants.USER_URL_DEACTIVATE,
    href: url});
  await store.setDomainPath(url, action);
}

function setActiveState(possumTab, active) {
  if (possumTab.active === active) {
    return;
  }
  toggleActiveState(possumTab);
}

function toggleActiveState(possumTab) {
  if (hasAction(possumTab, constants.TAB_DEACTIVATE)) {
    possumTab.setActiveState(true);
    delete possumTab.action;
  } else {
    possumTab.setActiveState(false);
    possumTab.action = tabDeactivate;
  }
}

function userHostDeactivateRequestHandler({tabs}, details) {
  details.shortCircuit = true;
  details.response = NO_ACTION;
  setActiveState(tabs.getTab(details.tabId), false);
}

async function onUserHostDeactivate({tabs, store}, {tabId}) {
  let active,
    url = new URL(tabs.getTabUrl(tabId));
  await store.updateDomain(url.href, (domain) => {
    if (hasAction(domain, constants.USER_HOST_DEACTIVATE)) {
      active = true;
      delete domain.action
    } else {
      active = false;
      Object.assign(domain, {
        action: new Action({
          reason: constants.USER_HOST_DEACTIVATE,
          href: url.href,
        }),
      });
    }
    return domain;
  });
  return setActiveState(tabs.getTab(tabId), active);
}

const reasons = [
  {
    name: FINGERPRINTING,
    funcs: {
      requestHandler: fingerPrintingRequestHandler,
      messageHandler: onFingerPrinting,
    },
  },
  {
    name: USER_URL_DEACTIVATE,
    funcs: {
      requestHandler: setResponse(NO_ACTION, true),
      messageHandler: onUserUrlDeactivate,
    },
  },
  {
    name: TAB_DEACTIVATE,
    funcs: {
      requestHandler: setResponse(NO_ACTION, true),
      tabHandler: ({}, {tab}) => {
        setTabIconActive(tab.id, !!tab.active);
      },
    },
  },
  {
    name: USER_HOST_DEACTIVATE,
    funcs: {
      requestHandler: userHostDeactivateRequestHandler,
      messageHandler: onUserHostDeactivate,
    },
  },
].map(({name, funcs}) => new Reason(name, funcs));

Object.assign(exports, {tabDeactivate, Reason, reasons});

})].map(func => typeof exports == 'undefined' ? define('/reasons/reasons', func) : func(exports));
