/**
 * Provides a synchronous record of tabs and their frames. Data is recorded from the
 * webrequest api.
 */


import {shim} from './shim.js';
const {URL, tabsGet, tabsQuery, tabsExecuteScript} = shim;

import {TYPES, REMOVE_ACTION, CONTENTSCRIPTS} from './constants.js';
import {Counter, listenerMixin, log} from './utils.js';
import {errorOccurred, setTabIconActive, safeSetBadgeText} from './browser_utils.js';
import {isThirdParty} from './domains/parties.js';

class Resource {
  constructor({url, method, type}) {
    this.url = url;
    this.method = method;
    this.type = type;
  }
}

class Frame {
  constructor({frameId, url, tabId, parentFrameId, requestId, type, urlObj}) {
    this.id = frameId;
    this.tabId = tabId;
    this.parentId = parentFrameId;
    this.requestId = requestId;
    this.resources = new Map();
    this.children = new Map();

    // Sometimes we get resources, but don't have their frames, so we don't
    // always have the frame url and stuff
    if (type && type.endsWith('_frame')) {
      this.url = url;
      this.type = type;
      if (!(urlObj instanceof URL)) {
        urlObj = new URL(url);
      }
      this.urlObj = urlObj;
    }
  }

  hasUrl(details) {
    return this.resources.has(details.url);
  }

  hasResource(details) {
    return this.resources.get(details.url).type === details.type;
  }

  recordResource(details) {
    if (!this.hasUrl(details)) {
      this.resources.set(details.url, new Resource(details));
    }
  }
}

class Tab extends listenerMixin(Map) {
  constructor(id) {
    super();
    this.id = id;

    this.active = true;
    this.actions = new Map();
    this.headerCounts = new Counter();
    this.headerCountsActive = true;

    this.onChange = this.onEvent;
    this.updateBadge();
  }

  // merge from anotherTab, don't overite own values
  merge(otherTab) {
    this.headerCounts.merge(otherTab.headerCounts);
    otherTab.forEach((value, key) => {
      if (!this.has(key)) {
        this.set(key, value);
      }
    });
  }

  getData() {
    return {
      active: this.active,
      actions: Array.from(this.actions),
      headerCounts: Array.from(this.headerCounts),
      headerCountsActive: this.headerCountsActive,
    };
  }

  async updateBadge() {
    let {active, actions, headerCounts} = this;
    this.setIcon(active);
    this.setBadgeText(active ? ('' + (actions.size + headerCounts.size)) : '');
  }

  async setIcon(active) {
    if (this.currentIcon != active) {
      await setTabIconActive(this.id, active);
      this.currentIcon = active;
    }
  }

  async setBadgeText(text) {
    if (text == '0') {
      text = '';
    }
    if (this.currentBadgeText != text) {
      await safeSetBadgeText(this.id, text);
      this.currentBadgeText = text;
    }
  }

  setActiveState(active) {
    this.active = active;
    this.onChange();
    this.updateBadge();
  }

  toggleActiveState() {
    this.setActiveState(!this.active);
  }

  async markAction(action, url) {
    if (!this.active) {
      return;
    }

    if (action.reason === REMOVE_ACTION) {
      this.actions.delete(url);
    } else {
      this.actions.set(url, action);
    }

    this.onChange();
    await this.updateBadge();
  }

  async markHeaders(removed) {
    removed.forEach(header => this.headerCounts.add(header.name.toLowerCase()));
    await this.onChange();
    await this.updateBadge();
  }
}

class Tabs {
  constructor() {
    this._data = new Map();
  }

  async getCurrentData() {
    for (let tab of await asyncTabsQuery()) {
      let tabId = tab.id;
      if (!tab.discarded) {
        for (let {frameId, parentFrameId, url} of await getAllFrames(tabId)) {
          this.addResource({
            tabId, frameId, parentFrameId, url,
            type: (frameId === 0 ? 'main_frame' : 'sub_frame'),
          });
        }
      } else {
        this.addResource({
          tabId, frameId: 0, parentFrameId: -1, url: tab.url, type: 'main_frame'
        });
      }
    }
  }

  async startListeners({onRemoved, onErrorOccurred, onNavigationCommitted} = shim) {
    onRemoved.addListener(this.removeTab.bind(this));
    onErrorOccurred.addListener(this.onErrorOccurred.bind(this));
    onNavigationCommitted.addListener(this.onNavigationCommitted.bind(this));

    await this.getCurrentData();
  }

  getTab(tabId) {
    return this._data.get(tabId);
  }

  hasTab(tabId) {
    return this._data.has(tabId);
  }

  setTab(tabId, value) {
    return this._data.set(tabId, value);
  }

  removeTab(tabId) {
    log(`Removing tabId: ${tabId}`);
    return this._data.delete(tabId);
  }

  onErrorOccurred({tabId, url, error}) {
    log(`Navigation error
      tabId: ${tabId}
      url: ${url}
      error: ${error}`);
    if (this.hasTab(tabId)) {
      tabsGet(tabId, () => {
        if (errorOccurred(e => log(`Error getting tab: ${tabId} error: ${e}`))) {
          this.removeTab(tabId);
        }
      });
    }
  }

  async onNavigationCommitted({tabId, frameId, url}) {
    const tab = this.getTab(tabId);
    if ((tabId >= 0) && tab && tab.active) {
      for (let file of CONTENTSCRIPTS) {
        await tabsExecuteScript(
          tabId,
          {frameId, runAt: 'document_start', matchAboutBlank: true, file},
          () => errorOccurred(e => log(`cannot inject content script ${file}
    on url: ${url}
    on tab: ${tabId}
    on frame: ${frameId}.
    errror message: '${e.message}'`)),
        );
      }
    };
  }

  getTabHostname(tabId) {
    try {
      return this.getFrame(tabId, 0).urlObj.hostname
    } catch(e) {
      return undefined;
    }
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
    return this.getTab(tabId).get(frameId);
  }

  isRequestThirdParty({tabId, initiator, type, urlObj: {hostname} = {}}) {
    if (type === TYPES.main_frame) {
      return false;
    }
    if (typeof initiator !== 'undefined') {
      return isThirdParty((new URL(initiator)).hostname, hostname);
    }
    if (tabId === -1) {
      return false; // no associated tab and no initiator info so we don't know
    }
    return this.isThirdParty(tabId, hostname);
  }

  isThirdParty(tabId, hostname) {
    let tabHost = this.getTabHostname(tabId);
    if (!tabHost) {
      log(`could not calculate tabhost for isThirdParty with hostname ${hostname} on tabId ${tabId}`);
      return false;
    }
    return isThirdParty(tabHost, hostname);
  }

  hasResource({tabId, frameId, url, type}) {
    try {
      return this.getTab(tabId).get(frameId).hasResource({url, type});
    } catch (e) {
      return false;
    }
  }

  addResource(details) {
    // if new tab, or new main_frame for existing tab
    if (!this.hasTab(details.tabId) || (details.type === 'main_frame')) {
      this.setTab(details.tabId, new Tab(details.tabId));
    }
    let tab = this.getTab(details.tabId);

    // if new frame
    if (!tab.has(details.frameId)) {
      tab.set(details.frameId, new Frame(details));
    }
    let frame = tab.get(details.frameId);

    // add resource to frame
    frame.recordResource(details);

    if (details.parentFrameId === -1) {
      return; // main_frame request
    }
    // add this frame to its parent, but make new parent if it doesn't exist first
    if (!tab.has(details.parentFrameId)) {
      tab.set(details.parentFrameId, new Frame({frameId: details.parentFrameId}));
    }
    tab.get(details.parentFrameId).children.set(frame.id, frame);
  }

  markAction(action, url, tabId) {
    this.getTab(tabId).markAction(action, url);
  }

  markHeaders(removed, tabId) {
    this.getTab(tabId).markHeaders(removed);
  }
};

async function asyncTabsQuery(queryInfo = {}) {
  return new Promise(resolve => tabsQuery(queryInfo, resolve));
}

async function getAllFrames(tabId) {
  return new Promise(resolve => shim.getAllFrames({tabId}, resolve));
}

export {Frame, Tabs, Tab};
