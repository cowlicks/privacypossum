"use strict";

(function(exports) {

class Resource {
  constructor({url, method, type}) {
    this.url = url;
    this.method = method;
    this.type = type;
  }
}

class Frame {
  constructor({frameId, url, tabId, parentFrameId, requestId, type}) {
    this.id = frameId;
    this.tabId = tabId;
    this.parentId = parentFrameId;
    this.requestId = requestId;
    this.resources = new Map();
    this.children = new Map();

    if (type && type.endsWith('_frame')) {
      this.url = url;
      this.type = type;
    }
  }

  hasResource(details) {
    return this.resources.has(details.url);
  }

  recordResource(details) {
    if (this.hasResource(details)) {
      this.resources.set(details.url, new Resource(details));
    }
  }
}


class Tabs {
  constructor() {
    this._data = new Map();
  }

  getTabUrl(tabId) {
    try {
      return this.getFrameUrl(tabId, 0);
    } catch(e) {
      return undefined;
    }
  }

  getFrameUrl(tabId, frameId) {
    try {
      return this.getFrame(tabId, frameId).url;
    } catch(e) {
      return undefined;
    }
  }

  getFrame(tabId, frameId) {
    return this._data.get(tabId).get(frameId);
  }

  addResource(details) {
    // if new tab, or new main_frame for existing tab
    if (!this._data.has(details.tabId) || (details.frameId === 0)) {
      this._data.set(details.tabId, new Map());
    }
    let tab = this._data.get(details.tabId);

    // if new frame
    if (!tab.has(details.frameId)) {
      tab.set(details.frameId, new Frame(details));
    }
    let frame = tab.get(details.frameId);

    // add resource to frame
    frame.recordResource(details);

    if (details.parentFrameId === -1) {
      return // main_frame request
    }
    // add this frame to its parent, but make new parent if it doesn't exist first
    if (!tab.has(details.parentFrameId)) {
      tab.set(details.parentFrameId, new Frame({frameId: details.parentFrameId}));
    }
    tab.get(details.parentFrameId).children.set(frame.id, frame);
  }

  removeTab(tabId) {
    return this._data.delete(tabId);
  }
};

Object.assign(exports, {Frame, Tabs});

})(typeof exports == 'undefined' ? require.scopes.tabs = {} : exports);
