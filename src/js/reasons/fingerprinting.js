"use strict";

[(function(exports) {

const {Action} = require('../schemes'),
  {sendUrlDeactivate} = require('./utils'),
  {URL, tabsSendMessage} = require('../shim'),
  {FINGERPRINTING, CANCEL} = require('../constants');

function fingerPrintingRequestHandler({tabs}, details) {
  if (tabs.isThirdParty(details.tabId, details.urlObj.hostname)) {
    Object.assign(details, {response: CANCEL, shortCircuit: false});
  } else {
    // send set fp signal
    let {tabId, frameId} = details;
    tabs.markAction({reason: FINGERPRINTING}, details.url, details.tabId);
    tabsSendMessage(tabId, {type: 'firstparty-fingerprinting', url: details.url}, {frameId});
  }
}

async function onFingerPrinting({store, tabs}, message, sender) {
  let tabId = sender.tab.id,
    {frameId} = sender,
    {url} = message,
    type = 'script';

  // NB: the url could be dangerous user input, so we check it is an existing resource.
  if (tabs.hasResource({tabId, frameId, url, type})) {
    let reason = FINGERPRINTING,
      frameUrl = tabs.getFrameUrl(tabId, frameId),
      tabUrl = tabs.getTabUrl(sender.tab.id),
      {href} = new URL(url);

    let action = new Action({reason, href, frameUrl, tabUrl});
    tabs.markAction({reason: FINGERPRINTING}, href, sender.tab.id);
    await store.setDomainPath(href, action);
  }
}

const fingerPrintingReason = {
  name: FINGERPRINTING,
  props: {
    in_popup: true,
    requestHandler: fingerPrintingRequestHandler,
    messageHandler: onFingerPrinting,
    popupHandler: sendUrlDeactivate,
  },
};

Object.assign(exports, {fingerPrintingReason});

})].map(func => typeof exports == 'undefined' ? define('/reasons/fingerprinting', func) : func(exports));

