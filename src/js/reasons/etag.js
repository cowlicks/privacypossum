"use strict";

[(function(exports) {

const {etag: {ETAG_TRACKING, ETAG_SAFE}} = require('../constants'),
  {log} = require('../utils'),
  {sendUrlDeactivate} = require('./utils'),
  {Action} = require('../schemes');

async function setEtagAction(store, href, reason, data={etagValue: null}) {
    log(`etag update with:
      reason: ${reason}
      url: ${href}
      etag value: ${data.etagValue}`);
    data.time = Date.now();
    return await store.setUrl(href, new Action(reason, data));
}

function etagHeader({store, cache}, details, header) {
  const {href} = details.urlObj,
    etagValue = header.value,
    action = store.getUrl(href);
  if (action) {
    if (action.reason === ETAG_TRACKING) {
      Object.assign(details, {action})
      return true;
    } else if (action.reason === ETAG_SAFE) {
      return false;
    }
  }
  if (cache.has(href)) {
    let oldEtagValue = cache.get(href).etagValue;
    cache.delete(href)
    if (etagValue === oldEtagValue) {
      // mark ETAG_SAFE
      setEtagAction(store, href, ETAG_SAFE, {etagValue});
      return false;
    } else {
      // mark ETAG_TRACKING
      setEtagAction(store, href, ETAG_TRACKING, {etagValue});
      Object.assign(details, new Action(ETAG_TRACKING, {etagValue}));
      return true;
    }
  } else {
    cache.set(href, {etagValue});
    return true;
  }
}

const reason = {
  name: ETAG_TRACKING,
  props: {
    popupHandler: sendUrlDeactivate,
    popup_info: {
      icon: '/media/etag-icon.png',
      message: 'blocked tracking etag',
      attribution: "CCBY Privacy Possum, US",
    }
  }
}

Object.assign(exports, {reason, etagHeader, setEtagAction});

})].map(func => typeof exports == 'undefined' ? define('/reasons/etag', func) : func(exports));
