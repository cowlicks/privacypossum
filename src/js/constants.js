"use strict";

(function(exports) {

// BlockingResponse types
const NO_ACTION = {},
  CANCEL = {cancel: true};

// suffix of main_frame & sub_frame
const FRAME_END = '_frame';

// reasons
const FINGERPRINTING = 'fingerprinting';

Object.assign(exports, {NO_ACTION, CANCEL, FRAME_END, FINGERPRINTING});

})(typeof exports == 'undefined' ? require.scopes.constants = {} : exports);
