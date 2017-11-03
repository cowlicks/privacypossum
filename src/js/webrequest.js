"use strict";

(function(exports) {

const {URL} = require('./shim');

class WebRequest {
  constructor(tabs, store) {
    this.tabs = tabs;
    this.store = store;
  }

  recordRequest(details) {
    if (details.type.endsWith('_frame')) {
      this.tabs.addResource(details);
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
