import {Action} from '../schemes.js';
import {log} from '../utils.js';
import {sendUrlDeactivate} from './utils.js';
import {FINGERPRINTING, USER_URL_DEACTIVATE, CANCEL} from '../constants.js';
import {shim} from '../shim.js';

const {URL, tabsSendMessage} = shim;

function isDeactivated(action) {
  return action && action.reason && action.reason === USER_URL_DEACTIVATE;
}

function fingerPrintingRequestHandler({tabs}, details) {
  const {url, tabId, frameId} = details;

  log(`request for fingerprinting script seen at
    tabId: ${tabId}, url: ${url}, and frameId ${frameId}`);
  if (tabs.isRequestThirdParty(details)) {
    log(`blocking 3rd party fingerprinting request`);
    Object.assign(details, {response: CANCEL, shortCircuit: false});
  } else {
    // send set fp signal
    if (tabId >= 0) {
      log(`intercepting 1st party fingerprinting script`);
      tabs.markAction({reason: FINGERPRINTING}, url, tabId);
      tabsSendMessage(tabId, {type: 'firstparty-fingerprinting', url}, {frameId});
    } else {
      log(`Error: 1st party fingerprinting request from negative tabId, probably from a cache thing`);
    }
  }
}

async function onFingerPrinting({store, tabs}, message, sender) {
  let tabId = sender.tab.id,
    {frameId} = sender,
    {url} = message,
    type = 'script';

  log(`received fingerprinting message from tab '${sender.tab.url}' for url '${url}'`);
  // NB: the url could be dangerous user input, so we check it is an existing resource.
  if (tabs.hasResource({tabId, frameId, url, type})) {
    let reason = FINGERPRINTING,
      frameUrl = tabs.getFrameUrl(tabId, frameId),
      tabUrl = tabs.getTabUrl(sender.tab.id),
      {href} = new URL(url),
      currentAction = store.getUrl(href);

    if (!isDeactivated(currentAction)) {
      log(`store fingerprinting data`);
      tabs.markAction({reason: FINGERPRINTING}, href, sender.tab.id);
      await store.setUrl(href, new Action(reason, {href, frameUrl, tabUrl}));
    } else {
      log(`ignoring fingerprinting message because this url is deactivated`);
    }
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

export {fingerPrintingReason};
