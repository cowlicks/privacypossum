"use strict";

[(function(exports) {

const {USER_URL_DEACTIVATE, NO_ACTION} = require('../constants'),
    {log} = require('../utils'),
    {setResponse, sendUrlDeactivate} = require('./utils'),
    {Action} = require('../schemes');

async function onUserUrlDeactivate({store, tabs}, {url, tabId}) {
  await store.updateUrl(url, currentAction => {
    let action;
    log(`got user deactivate message for action: ${currentAction} with url: ${url}`);
    if (currentAction.reason === USER_URL_DEACTIVATE) {
      action = currentAction.getData('deactivatedAction');
      log(`reactivating action: ${action} for url: ${url}`);
    } else {
      action = new Action(USER_URL_DEACTIVATE, {
        href: url,
        deactivatedAction: currentAction,
      });
      log(`deactivating action: ${currentAction} for url: ${url}`);
    }
    tabs.markAction(action, url, tabId);
    return action;
  });
}

const urlDeactivateReason = {
  name: USER_URL_DEACTIVATE,
  props: {
    requestHandler: setResponse(NO_ACTION, true),
    messageHandler: onUserUrlDeactivate,
    popupHandler: sendUrlDeactivate,
  },
}

Object.assign(exports, {onUserUrlDeactivate, urlDeactivateReason});

})].map(func => typeof exports == 'undefined' ? define('/reasons/user_url_deactivate', func) : func(exports));
