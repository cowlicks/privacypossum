"use strict";

[(function(exports) {

const {etag: {ETAG_TRACKING, ETAG_SAFE, ETAG_UNKNOWN}} = require('../constants'),
  {log} = require('../utils'),
  {sendUrlDeactivate} = require('./utils'),
  {Action} = require('../schemes');

// this should just be a method on store
async function setAction(store, href, reason, data={etagValue: null}) {
      log(`etag update with:
        reason: ${reason}
        url: ${href}
        etag value: ${data.etagValue}`);
      return await store.setUrl(href, new Action(reason, data));
}

function etagHeader({store}, details, header) {
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
    } else if (action.reason === ETAG_UNKNOWN) {
      if (etagValue === action.data.etagValue) {
        // mark ETAG_SAFE
        setAction(store, href, ETAG_SAFE, {etagValue});
        return false
      } else {
        // mark ETAG_TRACKING
        setAction(store, href, ETAG_TRACKING, {etagValue});
        return true;
      }
    }
  } else {
    // mark ETAG_UNKNOWN
    setAction(store, href, ETAG_UNKNOWN, {etagValue});
    return true;
  }
}

Object.assign(exports, {etagHeader, setAction});

})].map(func => typeof exports == 'undefined' ? define('/reasons/etag', func) : func(exports));
