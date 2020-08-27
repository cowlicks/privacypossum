import {etag} from '../constants.js';
import {log, LruMap} from '../utils.js';
import {sendUrlDeactivate} from './utils.js';
import {Action} from '../schemes.js';

const {ETAG_TRACKING} = etag;

async function setEtagAction(store, url, reason, data={etagValue: null}) {
    log(`etag update with:
      reason: ${reason}
      url: ${url}
      etag value: ${data.etagValue}`);
    data.time = Date.now();
    return await store.setUrl(url, new Action(reason, data));
}

function newEtagHeaderFunc(store) {
  let unknownEtags = new LruMap(2000),
    safeEtags = new LruMap(5000);
  return etagHeader.bind(undefined, {store, unknownEtags, safeEtags});
}

function etagHeader({store, unknownEtags, safeEtags}, details, header) {
  const {href} = details.urlObj,
    etagValue = header.value,
    action = store.getUrl(href);
  if (action && (action.reason === ETAG_TRACKING)) { // known tracking etag
    Object.assign(details, {action})
    return true;
  } else if (safeEtags.has(href)) { // known safe etag
    return false;
  } else if (unknownEtags.has(href)) { // 2nd time seeing this etag
    let oldEtagValue = unknownEtags.get(href).etagValue;
    unknownEtags.delete(href)
    if (etagValue === oldEtagValue) {
      safeEtags.set(href, {etagValue});
      return false;
    } else { // mark ETAG_TRACKING
      setEtagAction(store, href, ETAG_TRACKING, {etagValue});
      Object.assign(details, {action: new Action(ETAG_TRACKING, {etagValue})});
      return true;
    }
  } else { // unknown etag
    unknownEtags.set(href, {etagValue});
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

export {reason, etagHeader, setEtagAction, newEtagHeaderFunc};
