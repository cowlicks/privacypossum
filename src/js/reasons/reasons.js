"use strict";

[(function(exports) {

const {Action} = require('../schemes'),
  {setResponse, sendUrlDeactivate} = require('./utils'),
  {URL} = require('../shim'),
  {Listener, log, logger, setTabIconActive, hasAction} = require('../utils'),
  constants = require('../constants');

const {NO_ACTION, CANCEL, BLOCK, GET_DEBUG_LOG,
    USER_HOST_DEACTIVATE, TAB_DEACTIVATE, REMOVE_ACTION} = constants;

/**
 * `name` is the string name of this reasons, see constants.reasons.*
 * `messageHandler` function with signature ({store, tabs}, message, sender)
 * `requestHandler` function with signature ({store, tabs}, details)
 */
class Reason {
  constructor(name, {messageHandler, requestHandler, tabHandler, popup_info, popupHandler}) {
    Object.assign(this, {name, messageHandler, requestHandler, tabHandler, popup_info, popupHandler});
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

const tabDeactivate = new Action(TAB_DEACTIVATE), // should these go elsewhere?
  removeAction = new Action(REMOVE_ACTION),
  blockAction = new Action(BLOCK);

function onRemoveAction({store, tabs}, message) { // sent from popup so no `sender`
  tabs.markAction(removeAction, message.url, message.tabId);
  return store.deleteUrl(message.url);
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
        action: new Action(
          constants.USER_HOST_DEACTIVATE,
          {href: url.href},
        ),
      });
    }
    return domain;
  });
  return setActiveState(tabs.getTab(tabId), active);
}

const reasonsArray = [
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
      requestHandler: setResponse(CANCEL, true),
      popupHandler: sendUrlDeactivate,
      popup_info: {
        icon: '/media/block-icon.png',
        message: 'url blocked',
        attribution: "CCBY ProSymbols, US",
      }
    },
  },
  {
    name: REMOVE_ACTION,
    props: {
      messageHandler: onRemoveAction,
    },
  },
  {
    name: GET_DEBUG_LOG,
    props: {
      messageHandler: ({}, messenger, sender, sendResponse) => {
        log('got GET_DEBUG_LOG msg');
        return sendResponse(logger.prettyLog());
      },
    },
  },
];

reasonsArray.push(require('./fingerprinting').fingerPrintingReason);
reasonsArray.push(require('./user_url_deactivate').urlDeactivateReason);
reasonsArray.push(require('./headers').reason);
reasonsArray.push(require('./headers').tabReason);
reasonsArray.push(require('./etag').reason);
reasonsArray.push(require('./interacted').reason);

Object.assign(exports, {Reasons, reasonsArray, tabDeactivate, blockAction, Reason});

})].map(func => typeof exports == 'undefined' ? define('/reasons/reasons', func) : func(exports));
