"use strict";

/**
 * These get put in chrome storage, so we can't use Map/Set & stuff that doesn't serialize there.
 */
(function(exports) {

const constants = require('./constants');

const PATHS = 'paths';

// domain {
//   paths {
//     path {
//      action:
//      context:

class Context {
  // todo: add `old` property of previous contexts?
  constructor({reason, url, frameUrl, tabUrl}) {
    this.reason = reason;
    this.url = url;
    this.frameUrl = frameUrl;
    this.tabUrl = tabUrl;
  }
}

class Path {
  constructor(action, context) {
    this.action = action;
    this.context = context;
  }
}

class Domain {
  constructor(paths) {
    this.paths = paths || {};
  }

  // todo add context like, 3rd party, subframe, etc
  getAction(path) {
    let action = constants.NO_ACTION;
    if (this.paths.hasOwnProperty(path)) {
      action = this.paths[path].action;
    }
    return action;
  }

  setPath(path, action, context) {
    this.paths[path] = new Path(action, context);
  }
}

function updateDomainPath(domain, path, action, context) {
  if (typeof domain === 'undefined' || !domain.hasOwnProperty(PATHS)) {
    domain = new Domain();
  }
  domain.setPath(path, action, context);
  return domain;
}

Object.assign(exports, {Domain, Path, Context, updateDomainPath});

})(typeof exports == 'undefined' ? require.scopes.schemes = {} : exports);
