import {memoize} from '../utils.js';
import {getBaseDomain} from './basedomain.js';
import {isMdfp} from './mdfp.js';

function isThirdParty(d1, d2) {
  let b1 = getBaseDomain(d1),
    b2 = getBaseDomain(d2);

  if (b1 == b2 || isMdfp(b1, b2)) {
    return false;
  }
  return true;
}
isThirdParty = memoize(isThirdParty, ([a, b]) => a + ' ' + b, 1000);

export {isThirdParty};
