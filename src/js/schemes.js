"use strict";

/**
 * These get put in chrome storage, so we can't use Map/Set & stuff that doesn't serialize there.
 */
[(function(exports) {

const constants = require('./constants');

/*
 * Maybe each `reason should be in charge of creating its own action`
 *
 *  domain {
 *    paths {
 *      path {
 *       action {
 *         respnose: webrequest blockingResponse
 *         reason: reason for action
 *         href: the full url in question (this domain + path) (what abt port, protocol, etc?)
 *         frameUrl: url of frame this happened in
 *         tabUrl: url of the tab this happened in
 *
 */

class Action {
  constructor({response, reason, href, frameUrl, tabUrl}) {
    Object.assign(this, {response, reason, href, frameUrl, tabUrl});
  }
}

class Path {
  constructor(action) {
    this.action = action;
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

  getResponse(path) {
    let response = constants.NO_ACTION;
    if (this.paths.hasOwnProperty(path)) {
      response = this.paths[path].action.response;
    }
    return response;
  }

  setPath(path, action) {
    this.paths[path] = new Path(action);
    return this;
  }

  hasPath(path) {
    return this.paths.hasOwnProperty(path);
  }

  getPath(path) {
    return this.paths[path];
  }
}

function updateDomainPath(domain, path, action) {
  if (typeof domain === 'undefined' || !(domain instanceof Domain)) {
    domain = new Domain();
  }
  domain.setPath(path, action);
  return domain;
}

Object.assign(exports, {Action, Domain, Path, updateDomainPath});

})].map(func => typeof exports == 'undefined' ? require.scopes.schemes = func : func(exports));
