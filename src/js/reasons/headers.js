import {Action} from '../schemes.js';
import {shim} from '../shim.js';
import {hasAction} from '../utils.js';
import {newEtagHeaderFunc} from './etag.js';
import {Referer} from './referer.js';
import {HEADER_DEACTIVATE_ON_HOST, header_methods, NO_ACTION, TAB_DEACTIVATE_HEADERS} from '../constants.js';

const {URL} = shim;

const alwaysTrue = () => true;

class HeaderHandler {
  constructor(store) {
    this.referer = new Referer();
    this.badHeaders = new Map([
      ['cookie', alwaysTrue],
      ['set-cookie', alwaysTrue],
      ['referer', this.referer.shouldRemoveHeader.bind(this.referer)],
      ['etag', newEtagHeaderFunc(store)],
      ['if-none-match', alwaysTrue]
    ]);
  }

  removeHeaders(details, headers) {
    let removed = [];
    for (let i = 0; i < headers.length; i++) {
      while (i < headers.length && this.shouldRemoveHeader(details, headers[i])) {
        removed.push(...headers.splice(i, 1));
      }
    }
    return removed;
  }

  shouldRemoveHeader(details, header) {
    let name = header.name.toLowerCase();
    if (this.badHeaders.has(name)) {
      return this.badHeaders.get(name)(details, header);
    }
    return false;
  }
}

function isHeaderRequest(details) {
  return header_methods.has(details.requestType);
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

export {HeaderHandler, requestHandler, tabHeaderHandler, messageHandler, reason, tabReason};
