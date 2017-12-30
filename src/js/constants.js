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

// reasons
// todo move these into their own namespace
const FINGERPRINTING = 'fingerprinting',
  USER_HOST_DEACTIVATE = 'user_host_deactivate',
  USER_URL_DEACTIVATE = 'user_url_deactivate';

const TAB_DEACTIVATE = 'tab_deactivate';

const reasons = {FINGERPRINTING, USER_HOST_DEACTIVATE, USER_URL_DEACTIVATE, USER_HOST_DEACTIVATE};

// ports
const POPUP = 'popup';

Object.assign(exports, {
  DISK_NAME,
  NO_ACTION,
  CANCEL,
  TYPES,
  FRAME_END,
  inactiveIcons,
  activeIcons,
  FINGERPRINTING,
  USER_HOST_DEACTIVATE,
  USER_URL_DEACTIVATE,
  TAB_DEACTIVATE,
  POPUP,
});

})].map(func => typeof exports == 'undefined' ? define('/constants', func) : func(exports));
