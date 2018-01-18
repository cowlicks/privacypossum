"use strict";

[(function(exports) {

const {sendMessage} = require('../shim'),
  {USER_URL_DEACTIVATE} = require('../constants');

function sendUrlDeactivate({}, url, tabId) {
  sendMessage({type: USER_URL_DEACTIVATE, url, tabId});
}

Object.assign(exports, {sendUrlDeactivate});

})].map(func => typeof exports == 'undefined' ? define('/reasons/utils', func) : func(exports));

