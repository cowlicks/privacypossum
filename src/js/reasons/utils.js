"use strict";

[(function(exports) {

const {sendMessage} = require('../shim'),
  {REMOVE_ACTION, USER_URL_DEACTIVATE} = require('../constants');

function makeSendAction(type) {
  return function({}, url, tabId) {
    return sendMessage({type, url, tabId});
  };
}

const sendUrlDeactivate = makeSendAction(USER_URL_DEACTIVATE),
  sendRemoveAction = makeSendAction(REMOVE_ACTION);

Object.assign(exports, {sendUrlDeactivate, sendRemoveAction});

})].map(func => typeof exports == 'undefined' ? define('/reasons/utils', func) : func(exports));

