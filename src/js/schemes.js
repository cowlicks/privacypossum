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


/* `reason` is from constants.reasons* */
class Action {
  static coerce(obj) {
    return obj instanceof Action ? obj : new Action(obj.reason, obj.data);
  }
  constructor(reason, data) {
    Object.assign(this, {reason, data});
  }
  setData(key, val) {
    return this.data[key] = val;
  }
  getData(key) {
    return this.data[key];
  }
  deleteData(key) {
    return delete this.data[key];
  }
}

class Domain {
  constructor(data = {paths: {}}) {
    Object.assign(this, data);
  }

  setPath(path, action) {
    this.paths[path] = action;
    return this;
  }
  setPathAction(path, action) {
    action = Action.coerce(action);
    return this.setPath(path, {action});
  }

  hasPath(path) {
    return this.paths && this.paths.hasOwnProperty(path);
  }

  getPath(path) {
    return this.paths[path];
  }
  getPathAction(path) {
    if (this.hasPath(path)) {
      return Action.coerce(this.getPath(path).action);
    }
  }

  deletePath(path) {
    delete this.paths[path];
    return this;
  }

  updatePath(path, callback) {
    return this.setPath(path, callback(this.getPath(path)));
  }
  updatePathAction(path, callback) {
    return this.setPathAction(path, callback(this.getPathAction(path)));
  }
}

export {Action, Domain};
