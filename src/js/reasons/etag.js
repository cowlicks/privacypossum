"use strict";

[(function(exports) {

const {etag: {ETAG_TRACKING, ETAG_SAFE}} = require('../constants'),
  {log} = require('../utils'),
  {sendUrlDeactivate} = require('./utils'),
  {Action} = require('../schemes');

async function setAction(store, href, reason, data={etagValue: null}) {
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
      log(`known tracking etag:
        reason: ${action.reason}
        url: ${href}
        etag value: ${etagValue}`);
      Object.assign(details, {action})
      return true;
    } else if (action.reason === ETAG_SAFE) {
      log(`known safe etag:
        reason: ${action.reason}
        url: ${href}
        etag value: ${etagValue}`);
      // allow header
      return false;
    }
  }
  if (cache.has(href)) {
    if (etagValue === cache.get(href).etagValue) {
      // mark ETAG_SAFE
      setAction(store, href, ETAG_SAFE, {etagValue});
      cache.delete(href)
      return false
    } else {
      // mark ETAG_TRACKING
      setAction(store, href, ETAG_TRACKING, {etagValue});
      Object.assign(details, new Action(ETAG_TRACKING, {etagValue}));
      cache.delete(href)
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

Object.assign(exports, {reason, etagHeader, setAction});

})].map(func => typeof exports == 'undefined' ? define('/reasons/etag', func) : func(exports));
