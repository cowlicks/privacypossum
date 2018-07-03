"use strict";

[(function(exports) {

const {INTERACTION} = require('../constants');

function onMessage({tabs}, message, sender) {
  let tabId = sender.tab.id,
    {hostname} = message;
  tabs.updateInteractionWhitelist(tabId, hostname);
}

const reason = {
  name: INTERACTION,
  props: {
    messageHandler: onMessage,
  }
}

Object.assign(exports, {reason});

})].map(func => typeof exports == 'undefined' ? define('/reasons/interacted', func) : func(exports));
