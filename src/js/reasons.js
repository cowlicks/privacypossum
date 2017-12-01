"use strict";

[(function(exports) {

const {Action} = require('./schemes'),
  {NO_ACTION, CANCEL, FINGERPRINTING, USER_URL_DEACTIVATE,
    USER_HOST_DEACTIVATE, TAB_DEACTIVATE} = require('./constants');

function setResponse(response, shortCircuit) {
  return (details) => Object.assign(details, {response, shortCircuit});
}

const tabDeactivate = new Action({response: NO_ACTION, reason: TAB_DEACTIVATE});

function makeReasonMap(tabs) {
  return new Map([
    [FINGERPRINTING, setResponse(CANCEL, false)],
    [USER_URL_DEACTIVATE, setResponse(NO_ACTION, false)],
    [TAB_DEACTIVATE, setResponse(NO_ACTION, true)],
    [USER_HOST_DEACTIVATE, (details) => {
      details.shortCircuit = true;
      details.response = NO_ACTION;
      tabs.getTab(details.tabId).action = tabDeactivate;
    }],
  ]);
}

// todo wrap handler requests to assure main_frame's are not blocked.
class Handler {
  constructor(tabs) {
    this.tabs = tabs;
    this.reasonMap = makeReasonMap(tabs);
  }

  handleRequest(obj, details) {
    if (obj.hasOwnProperty('action')) {
      this.reasonMap.get(obj.action.reason)(details);
    }
  }
}

Object.assign(exports, {Handler, tabDeactivate});

})].map(func => typeof exports == 'undefined' ? require.scopes.reasons = func : func(exports));
