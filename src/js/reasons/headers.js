"use strict";

[(function(exports) {

const {Action} = require('../schemes'),
  {URL} = require('../shim'),
  {hasAction} = require('../utils'),
  {HEADER_DEACTIVATE_ON_HOST, header_methods, NO_ACTION, TAB_DEACTIVATE_HEADERS} = require('../constants');

function isHeaderRequest(details) {
  return header_methods.has(details.method);
}

function requestHandler({tabs}, details) {
  if (details.type === 'main_frame') {
    Object.assign(details, {shortCircuit: true, response: NO_ACTION});
    let tab = tabs.getTab(details.tabId);
    tab.action = new Action(TAB_DEACTIVATE_HEADERS);
    tab.headerCountsActive = false;
    tab.onChange();
  }
}

function tabHeaderHandler({}, details) {
  if (isHeaderRequest(details)) {
    return Object.assign(details, {
      response: NO_ACTION,
      shortCircuit: true,
    });
  }
}

async function messageHandler({tabs, store}, {tabId, checked}) {
  let url = new URL(tabs.getTabUrl(tabId));
  await store.updateDomain(url.href, (domain) => {
    if (hasAction(domain, HEADER_DEACTIVATE_ON_HOST) && checked) {
      store.deleteDomain(url.href);
    } else if (!checked) {
      return Object.assign(domain, {
        action: new Action(
          HEADER_DEACTIVATE_ON_HOST,
          {href: url.href},
        ),
      })
    }
  });
  let tab = tabs.getTab(tabId);
  tab.headerCountsActive = checked;
  if (!checked) {
    tab.action = new Action(TAB_DEACTIVATE_HEADERS);
  } else if (checked && tab.action && tab.action.reason === TAB_DEACTIVATE_HEADERS) {
    delete tab.action;
  }
  tab.onChange();
}

const reason = {
  name: HEADER_DEACTIVATE_ON_HOST,
  props: {
    requestHandler,
    messageHandler,
  },
}

const tabReason = {
  name: TAB_DEACTIVATE_HEADERS,
  props: {
    requestHandler: tabHeaderHandler,
  }
}

Object.assign(exports, {requestHandler, tabHeaderHandler, messageHandler, reason, tabReason});

})].map(func => typeof exports == 'undefined' ? define('/reasons/headers', func) : func(exports));
