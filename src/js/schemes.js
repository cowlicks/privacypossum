"use strict";

/**
 * These things get written to disk, so we can't use Map/Set & stuff that doesn't serialize there.
 *
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

[(function(exports) {

/* `reason` is from constants.reasons* */
class Action {
  constructor({reason, href, frameUrl, tabUrl}) {
    Object.assign(this, {reason, href, frameUrl, tabUrl});
  }
}

class Path {
  constructor(action) {
    this.action = action;
  }
}

class Domain {
  constructor(data = {paths: {}}) {
    Object.assign(this, data);
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

  updatePath(path, callback) {
    return this.setPath(path, callback(this.getPath));
  }
}

Object.assign(exports, {Action, Domain, Path});

})].map(func => typeof exports == 'undefined' ? define('/schemes', func) : func(exports));
