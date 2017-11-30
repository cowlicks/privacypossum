"use strict";

/**
 * These get put in chrome storage, so we can't use Map/Set & stuff that doesn't serialize there.
 */
[(function(exports) {

const constants = require('./constants');

// domain {
//   paths {
//     path {
//      action:
//      context:

class Context {
  // todo: add `old` property of previous contexts?
  // change name of `url` to `href`
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
  constructor(data) {
    if (typeof data === 'undefined') {
      this.paths = {};
    } else {
      this.paths = data.paths;
    }
  }

  // todo add context like, 3rd party, subframe, etc
  getResponse(path) {
    let action = constants.NO_ACTION;
    if (this.paths.hasOwnProperty(path)) {
      action = this.paths[path].action;
    }
    return action;
  }

  setPath(path, action, context) {
    this.paths[path] = new Path(action, context);
    return this;
  }
}

function updateDomainPath(domain, path, action, context) {
  if (typeof domain === 'undefined' || !(domain instanceof Domain)) {
    domain = new Domain();
  }
  domain.setPath(path, action, context);
  return domain;
}

Object.assign(exports, {Domain, Path, Context, updateDomainPath});

})].map(func => typeof exports == 'undefined' ? require.scopes.schemes = func : func(exports));
