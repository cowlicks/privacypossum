"use strict";

[(function(exports) {

const {Action} = require('../schemes'),
  {log} = require('../utils'),
  {sendUrlDeactivate} = require('./utils'),
  {URL, tabsSendMessage} = require('../shim'),
  {FINGERPRINTING, CANCEL} = require('../constants');

function fingerPrintingRequestHandler({tabs}, details) {
  log(`request for fingerprinting script seen at ${details.url}`);
  if (tabs.isThirdParty(details.tabId, details.urlObj.hostname)) {
    log(`blocking 3rd party fingerprinting request`);
    Object.assign(details, {response: CANCEL, shortCircuit: false});
  } else {
    // send set fp signal
    log(`intercepting 1st party fingerprinting script in page`);
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

  log(`received fingerprinting message from tab ${sender.tab.url} for url ${url}`);
  // NB: the url could be dangerous user input, so we check it is an existing resource.
  if (tabs.hasResource({tabId, frameId, url, type})) {
    let reason = FINGERPRINTING,
      frameUrl = tabs.getFrameUrl(tabId, frameId),
      tabUrl = tabs.getTabUrl(sender.tab.id),
      {href} = new URL(url);

    log(`Store fingerprinting data`);
    let action = new Action(reason, {href, frameUrl, tabUrl});
    tabs.markAction({reason: FINGERPRINTING}, href, sender.tab.id);
    await store.setUrl(href, action);
  }
}

const fingerPrintingReason = {
  name: FINGERPRINTING,
  props: {
    requestHandler: fingerPrintingRequestHandler,
    messageHandler: onFingerPrinting,
    popupHandler: sendUrlDeactivate,
    popup_info: {
      icon: '/media/fingerprinting-icon.png',
      message: 'fingerprinting detected and blocked',
      attribution: "CCBY Ciprian Popescu, RO",
    }
  },
};

Object.assign(exports, {fingerPrintingReason});

})].map(func => typeof exports == 'undefined' ? define('/reasons/fingerprinting', func) : func(exports));

