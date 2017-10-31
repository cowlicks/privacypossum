"use strict";

(function(exports) {

const {Frame} = require('./tabs');

class WebRequest {
  constructor(tabs, storage) {
    this.tabs = tabs;
    this.storage = storage;
  }

  recordRequest(details) {
    if (details.type.endsWith('_frame')) {
      this.tabs.addFrame(new Frame(details));
    }
  }

  commitRequest() {
    return {};
  }

  onBeforeRequest(details) {
    this.recordRequest(details);
    return this.commitRequest(details);
  }
}

Object.assign(exports, {WebRequest});

})(typeof exports == 'undefined' ? require.scopes.webrequest = {} : exports);
