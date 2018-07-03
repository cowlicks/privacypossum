"use strict";

[(function(exports) {

// disk name
const DISK_NAME = 'p055um';

// BlockingResponse types
const NO_ACTION = {},
  CANCEL = {cancel: true};
const responses = {CANCEL, NO_ACTION};

// suffix of main_frame & sub_frame
const TYPES = {
  main_frame : 'main_frame',
  sub_frame : 'sub_frame',
};

const FRAME_END = '_frame';

const inactiveIcons = {
  48: "/media/icon-inactive48.png",
  96: "/media/icon-inactive96.png",
  256: "/media/icon-inactive256.png",
}

const activeIcons = {
  48: "/media/icon48.png",
  64: "/media/icon64.png",
  96: "/media/icon96.png",
  256: "/media/icon256.png",
}

const request_methods = {
  ON_BEFORE_REQUEST: 'onBeforeRequest',
  ON_HEADERS_RECEIVED: 'onHeadersReceived',
  ON_BEFORE_SEND_HEADERS: 'onBeforeSendHeaders',
};

const http_headers = {
  REQUEST: 'requestHeaders',
  RESPONSE: 'responseHeaders',
};

const header_methods = new Map([
  [request_methods.ON_HEADERS_RECEIVED, http_headers.RESPONSE],
  [request_methods.ON_BEFORE_SEND_HEADERS, http_headers.REQUEST],
]);

// reasons
// todo move these into their own namespace
const FINGERPRINTING = 'fingerprinting',
  INTERACTION = 'interaction',
  USER_HOST_DEACTIVATE = 'user_host_deactivate',
  USER_URL_DEACTIVATE = 'user_url_deactivate',
  BLOCK = 'block',
  HEADER_DEACTIVATE_ON_HOST = 'header_deactivate_on_host';

const CONTENTSCRIPTS = new Set([
  '/js/bootstrap.js',
  '/js/contentscripts/fingercounting.js',
  '/js/initialize_contentscripts.js',
]);

const etag = {
  ETAG_TRACKING: 'etag_tracking',
  ETAG_SAFE: 'etag_safe',
}

const TAB_DEACTIVATE = 'tab_deactivate',
  TAB_DEACTIVATE_HEADERS = 'tab_deactivate_headers';

const reasons = {FINGERPRINTING, USER_HOST_DEACTIVATE, USER_URL_DEACTIVATE, USER_HOST_DEACTIVATE};

// ports
const POPUP = 'popup';

const REMOVE_ACTION = 'remove_action';

const GET_DEBUG_LOG = 'get_debug_log';

Object.assign(exports, {
  DISK_NAME,
  responses,
  NO_ACTION,
  CANCEL,
  TYPES,
  FRAME_END,
  inactiveIcons,
  activeIcons,
  reasons,
  request_methods,
  header_methods,
  INTERACTION,
  FINGERPRINTING,
  CONTENTSCRIPTS,
  USER_HOST_DEACTIVATE,
  USER_URL_DEACTIVATE,
  BLOCK,
  HEADER_DEACTIVATE_ON_HOST,
  etag,
  TAB_DEACTIVATE,
  TAB_DEACTIVATE_HEADERS,
  POPUP,
  REMOVE_ACTION,
  GET_DEBUG_LOG,
});

})].map(func => typeof exports == 'undefined' ? define('/constants', func) : func(exports));
