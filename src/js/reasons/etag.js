"use strict";

[(function(exports) {

const {etag: {ETAG_TRACKING, ETAG_SAFE, ETAG_UNKNOWN}} = require('../constants'),
    {Action} = require('../schemes');

// if first instance of etag for this url, remove it and store the etag
// if 2nd time seeing etag for this url, compare new etag with old? if same allow it
// if it isnt the same mark the url as etag tracking and strip the etag
function etagHeader({store}, details, header) {
  const {href} = details.urlObj,
    etagValue = header.value,
    action = store.getUrl(href);
  if (action) {
    if (action.reason === ETAG_TRACKING) {
      // strip header
    }
    else if (action.reason === ETAG_SAFE) {
      // allow header
    }
    else if (action.reason === ETAG_UNKNOWN) {
      if (etagValue === action.etagValue) {
        // mark ETAG_SAFE
        // allow header
      } else {
        // mark ETAG_TRACKING
        // strip header
      }
    }
  } else {
    // mark ETAG_UNKNOWN
    return [true, store.setUrl(href, new Action(ETAG_UNKNOWN, {etagValue}))];
  }
}

Object.assign(exports, {etagHeader});

})].map(func => typeof exports == 'undefined' ? define('/reasons/etag', func) : func(exports));
