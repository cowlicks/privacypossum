"use strict";

[(function(exports) {

const {INTERACTION} = require('../constants'),
    {log, LruMap} = require('../utils');

class FifoSet extends Set {
  constructor(maxSize = 100) {
    super();
    Object.assign(this, {maxSize});
  }

  add(item) {
    super.add(item);
    if (this.size > this.maxSize) {
      this.delete(this.keys().next().value);
    }
  }
}

class InteractionWhitelist {
  constructor({tabCacheSize=100, hostnameCacheSize=100} = {}) {
    Object.assign(this, {tabCacheSize, hostnameCacheSize});
    this.tabs = new LruMap(tabCacheSize);
  }

  update(tabId, hostname) {
    if (!this.tabs.has(tabId)) {
      this.tabs.set(tabId, new FifoSet(this.hostnameCacheSize));
    }
    this.tabs.get(tabId).add(hostname);
    return this;
  }

  has(tabId, hostname) {
    if (this.tabs.has(tabId)) {
      return this.tabs.get(tabId).has(hostname);
    }
    return false;
  }
}

function wrapTabs(tabs) {
  const interactionWhiteList = new InteractionWhitelist(),
    origIsThirdParty = tabs.isThirdParty.bind(tabs),
    isThirdParty = (tabId, hostname) => {
      if (interactionWhiteList.has(tabId, hostname)) {
        return false
      }
      return origIsThirdParty(tabId, hostname);
    };
  log('wrapping tabs object for interactive whitelist');
  Object.assign(tabs, {isThirdParty, interactionWhiteList});
}

function onMessage({tabs}, message, sender) {
  let tabId = sender.tab.id,
    {hostname} = message;
  if (!tabs.interactionWhiteList) {
    wrapTabs(tabs);
  }
  tabs.interactionWhiteList.update(tabId, hostname);
}

const reason = {
  name: INTERACTION,
  props: {
    messageHandler: onMessage,
  }
}

Object.assign(exports, {reason, InteractionWhitelist, wrapTabs});

})].map(func => typeof exports == 'undefined' ? define('/reasons/interacted', func) : func(exports));
