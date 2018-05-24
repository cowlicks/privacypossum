"use strict";

[(function(exports) {

const {etag: {ETAG_TRACKING, ETAG_SAFE}} = require('../constants'),
  {log} = require('../utils'),
  {sendUrlDeactivate} = require('./utils'),
  {Action} = require('../schemes');

async function setEtagAction(store, url, reason, data={etagValue: null}) {
    log(`etag update with:
      reason: ${reason}
      url: ${url}
      etag value: ${data.etagValue}`);
    data.time = Date.now();
    return await store.setUrl(url, new Action(reason, data));
}

function etagHeader({store, unknownEtagCache}, details, header) {
  const {protocol, host, pathname} = details.urlObj,
    url  = `${protocol}//${host}${pathname}`,
    etagValue = header.value,
    action = store.getUrl(url);
  if (action) {
    if (action.reason === ETAG_TRACKING) {
      Object.assign(details, {action})
      return true;
    } else if (action.reason === ETAG_SAFE) {
      return false;
    }
  }
  if (unknownEtagCache.has(url)) {
    let oldEtagValue = unknownEtagCache.get(url).etagValue;
    unknownEtagCache.delete(url)
    if (etagValue === oldEtagValue) {
      // mark ETAG_SAFE
      setEtagAction(store, url, ETAG_SAFE, {etagValue});
      return false;
    } else {
      // mark ETAG_TRACKING
      setEtagAction(store, url, ETAG_TRACKING, {etagValue});
      Object.assign(details, {action: new Action(ETAG_TRACKING, {etagValue})});
      return true;
    }
  } else {
    unknownEtagCache.set(url, {etagValue});
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
