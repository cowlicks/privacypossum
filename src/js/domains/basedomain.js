/**
 * Based on https://github.com/cowlicks/privacybadgerchrome/300d41eb1de22493aabdb46201a148c028a6228d/src/lib/basedomain.js
 */

/**
 * Parts of original code from ipv6.js <https://github.com/beaugunderson/javascript-ipv6>
 * Copyright 2011 Beau Gunderson
 * Available under MIT license <http://mths.be/mit>
 */


import {publicSuffixes} from './psl.js';
import {memoize} from '../utils.js';

const re_ipv4 = /[0-9]$/;

function isIPv4(hostname) {
  return !!hostname.match(re_ipv4);
}

function isIPv6(hostname) {
  return hostname.endsWith(']');
}

/**
 * Returns base domain for specified host based on Public Suffix List.
 * @param {String} hostname The name of the host to get the base domain for
 */
function getBaseDomain(/**String*/ hostname) {
  // remove trailing dot(s)
  hostname = hostname.replace(/\.+$/, '');

  // return IP address untouched
  if (isIPv6(hostname) || isIPv4(hostname)) {
    return hostname;
  }

  // search through PSL
  var prevDomains = [];
  var curDomain = hostname;
  var nextDot = curDomain.indexOf('.');
  var tld = 0;

  while (true) {
    var suffix = publicSuffixes.get(curDomain);
    if (typeof(suffix) != 'undefined') {
      tld = suffix;
      break;
    }

    if (nextDot < 0) {
      tld = 1;
      break;
    }

    prevDomains.push(curDomain.substring(0,nextDot));
    curDomain = curDomain.substring(nextDot+1);
    nextDot = curDomain.indexOf('.');
  }

  while (tld > 0 && prevDomains.length > 0) {
    curDomain = prevDomains.pop() + '.' + curDomain;
    tld--;
  }

  return curDomain;
}
getBaseDomain = memoize(getBaseDomain, (x) => x, 1000);

export {getBaseDomain};
