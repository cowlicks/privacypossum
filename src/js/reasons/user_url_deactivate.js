"use strict";

[(function(exports) {

const {USER_URL_DEACTIVATE, NO_ACTION} = require('../constants'),
    {setResponse, sendRemoveAction} = require('./utils'),
    {Action} = require('../schemes');

async function onUserUrlDeactivate({store, tabs}, {url, tabId}) {
  let action = new Action(
    USER_URL_DEACTIVATE,
    {href: url},
  );
  tabs.markAction(action, url, tabId);
  await store.updateUrl(url, before => {
    action.setData('deactivatedAction', before);
    return action;
  });
}

const urlDeactivateReason = {
  name: USER_URL_DEACTIVATE,
  props: {
    in_popup: true,
    requestHandler: setResponse(NO_ACTION, true),
    messageHandler: onUserUrlDeactivate,
    popupHandler: sendRemoveAction,
  },
}

Object.assign(exports, {onUserUrlDeactivate, urlDeactivateReason});

})].map(func => typeof exports == 'undefined' ? define('/reasons/user_url_deactivate', func) : func(exports));
