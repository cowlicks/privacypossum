"use strict";

(function(exports) {

function Frame({frameId, url, tabId, parentFrameId, requestId, type}) {
  this.id = frameId;
  this.url = url;
  this.tabId = tabId;
  this.parentId = parentFrameId;
  this.requestId = requestId;
  this.type = type;
}

function Tabs() {
  this._data = new Map();
}

Tabs.prototype = {
  getTabUrl: function(tabId) {
    return this.getFrameUrl(tabId, 0);
  },

  getFrameUrl: function(tabId, frameId) {
    try {
      return this.getFrame(tabId, frameId).url;
    } catch (e) {
      return undefined;
    }
  },

  getFrame: function(tabId, frameId) {
    try {
      return this._data.get(tabId).get(frameId);
    } catch (e) {
      return undefined;
    }
  },

  addFrame: function(frame) {
    // if new tab, or new main_frame for existing tab
    if (!this._data.has(frame.tabId) || (frame.id === 0)) {
      this._data.set(frame.tabId, new Map());
    }
    this._data.get(frame.tabId).set(frame.id, frame);
  },

  removeTab: function(tabId) {
    return this._data.delete(tabId);
  },
};

Object.assign(exports, {Frame, Tabs});

})(typeof exports == 'undefined' ? require.scopes.tabs = {} : exports);
