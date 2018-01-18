"use strict";

[(function(exports) {

const {Action} = require('../schemes'),
  {sendUrlDeactivate} = require('./utils'),
  {URL, sendMessage} = require('../shim'),
  {Listener, setTabIconActive, hasAction} = require('../utils'),
  constants = require('../constants');

const {NO_ACTION, CANCEL, USER_URL_DEACTIVATE, BLOCK,
    USER_HOST_DEACTIVATE, TAB_DEACTIVATE, REMOVE_ACTION} = constants;

function setResponse(response, shortCircuit) {
  return ({}, details) => Object.assign(details, {response, shortCircuit});
}

/**
 * `name` is the string name of this reasons, see constants.reasons.*
 * `messageHandler` function with signature ({store, tabs}, message, sender)
 * `requestHandler` function with signature ({store, tabs}, details)
 */
class Reason {
  constructor(name, {messageHandler, requestHandler, tabHandler, in_popup, popupHandler}) {
    Object.assign(this, {name, messageHandler, requestHandler, tabHandler, in_popup, popupHandler});
  }
}

class Reasons extends Listener {
  constructor(reasons = []) {
    super();
    this.reasons = new Set();
    reasons.map(this.addReason.bind(this));
  }

  static fromArray(reasonsArray) {
    return new Reasons(reasonsArray.map(({name, props}) => new Reason(name, props)));
  }

  map(func) {
    return Array.from(this.reasons).map(func);
  }

  addReason(reason) {
    if (!this.reasons.has(reason)) {
      this.reasons.add(reason);
      this.onEvent(reason);
    }
  }
}

const tabDeactivate = new Action({reason: TAB_DEACTIVATE}), // should these go elsewhere?
  removeAction = new Action({reason: REMOVE_ACTION}),
  blockAction = new Action({reason: BLOCK});

function sendRemoveAction({}, url, tabId) {
  sendMessage({type: REMOVE_ACTION, url, tabId});
}

function onRemoveAction({store, tabs}, message) { // sent from popup so no `sender`
  tabs.markAction(removeAction, message.url, message.tabId);
  return store.deleteDomainPath(message.url);
}

async function onUserUrlDeactivate({store, tabs}, {url, tabId}) {
  let action = new Action({
    reason: constants.USER_URL_DEACTIVATE,
    href: url});
  tabs.markAction(action, url, tabId);
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

const reasonsArray = [
  {
    name: USER_URL_DEACTIVATE,
    props: {
      in_popup: true,
      requestHandler: setResponse(NO_ACTION, true),
      messageHandler: onUserUrlDeactivate,
      popupHandler: sendRemoveAction,
    },
  },
  {
    name: TAB_DEACTIVATE,
    props: {
      requestHandler: setResponse(NO_ACTION, true),
      tabHandler: ({}, {tab}) => {
        setTabIconActive(tab.id, !!tab.active);
      },
    },
  },
  {
    name: USER_HOST_DEACTIVATE,
    props: {
      requestHandler: userHostDeactivateRequestHandler,
      messageHandler: onUserHostDeactivate,
    },
  },
  {
    name: BLOCK,
    props: {
      in_popup: true,
      requestHandler: setResponse(CANCEL, true),
      popupHandler: sendUrlDeactivate,
    },
  },
  {
    name: REMOVE_ACTION,
    props: {
      messageHandler: onRemoveAction,
    },
  },
];

reasonsArray.push(require('./fingerprinting').fingerPrintingReason);

Object.assign(exports, {Reasons, reasonsArray, tabDeactivate, blockAction, Reason});

})].map(func => typeof exports == 'undefined' ? define('/reasons/reasons', func) : func(exports));
