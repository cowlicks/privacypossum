import {shim} from './shim.js';

/*
 * Firefox & Chrome now take different values in opt_extraInfoSpec
 */
function getOnBeforeRequestOptions({OnBeforeRequestOptions} = shim) {
  return ["BLOCKING"].map(x => OnBeforeRequestOptions[x]).filter(x => x);
}

function getOnBeforeSendHeadersOptions({OnBeforeSendHeadersOptions} = shim) {
  return ["BLOCKING", "REQUEST_HEADERS", "REQUESTHEADERS", "EXTRA_HEADERS"].map(x => OnBeforeSendHeadersOptions[x]).filter(x => x);
}

function getOnHeadersReceivedOptions({OnHeadersReceivedOptions} = shim) {
  return ["BLOCKING", "RESPONSE_HEADERS", "RESPONSEHEADERS", "EXTRA_HEADERS"].map(x => OnHeadersReceivedOptions[x]).filter(x => x);
}

export {getOnBeforeRequestOptions, getOnBeforeSendHeadersOptions, getOnHeadersReceivedOptions};
