"use strict";

[(function(exports) {

const shim = require('./shim');

/*
 * Firefox & Chrome now take different values in opt_extraInfoSpec
 */
function getOnBeforeRequestOptions({onBeforeRequestOptions} = shim) {
  return["blocking"].filter(x => onBeforeRequestOptions[x]);
}

function getOnBeforeSendHeadersOptions({onBeforeSendHeadersOptions} = shim) {
  return ["blocking", "requestHeaders", "extraHeaders"].filter(x => onBeforeSendHeadersOptions[x]);
}

function getOnHeadersReceivedOptions({onHeadersReceivedOptions} = shim) {
  return ["blocking", "responseHeaders", "extraHeaders"].filter(x => onHeadersReceivedOptions[x]);
}

Object.assign(exports, {getOnBeforeRequestOptions, getOnBeforeSendHeadersOptions, getOnHeadersReceivedOptions});

})].map(func => typeof exports == 'undefined' ? define('/browser_compat', func) : func(exports));
