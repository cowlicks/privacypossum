"use strict";

(function(exports) {

// disk name
const DISK_NAME = 'p055um';

// BlockingResponse types
const NO_ACTION = {},
  CANCEL = {cancel: true};

// suffix of main_frame & sub_frame
const TYPES = {
  main_frame : 'main_frame',
  sub_frame : 'sub_frame',
};

const FRAME_END = '_frame';

// reasons
const FINGERPRINTING = 'fingerprinting';

// ports
const POPUP = 'popup';

Object.assign(exports, {NO_ACTION, CANCEL, TYPES, FRAME_END, FINGERPRINTING, DISK_NAME, POPUP});

})(typeof exports == 'undefined' ? require.scopes.constants = {} : exports);
