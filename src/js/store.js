"use strict";

(function(exports) {

const {DiskMap} = require('./disk_map'),
  {Tree, splitter} = require('./suffixtree'),
  {Domain} = require('./schemes'),
  {URL, Disk} = require('./shim');

class DomainTree extends Tree {
  beforeSet(val) {
    return (val instanceof Domain) ? val : new Domain(val);
  }

  set(key, val) {
    return super.set(key, this.beforeSet(val));
  }
}

class DomainStore {
  constructor(name, disk, splitter_) {
    if (typeof disk === 'undefined') {
      disk = Disk.newDisk();
    }

    if (typeof splitter_ === 'undefined') {
      splitter_ = splitter;
    }
    this.init(name, disk, splitter_);
  }

  init(name, disk, splitter) {
    this.tree = new DomainTree(splitter);
    this.diskMap = new DiskMap(name, disk);
    this.attachMethods();
  }

  static async load(name, disk) {
    let out = new DomainStore(name, disk);
    await out.diskMap.loadKeys();
    for (let key of out.keys) {
      out.tree.set(key, await out.diskMap.get(key));
    }
    return out;
  }

  get keys() {
    return this.diskMap.keys;
  }

  attachMethods() {
    this.get = this.tree.get.bind(this.tree);
    this.getBranchData = this.tree.getBranchData.bind(this.tree);
  }

  has(key) {
    return this.keys.has(key);
  }

  async set(key, value) {
    this.tree.set(key, value);
    await this.diskMap.set(key, value);
  }

  async update(key, callback) {
    await this.set(key, callback(this.get(key)));
  }

  /* URL specific stuff */
  getUrl(url) {
    url = new URL(url);
    return this.get(url.hostname);
  }

  async setUrl(url, value) {
    url = new URL(url);
    await this.set(url.hostname, value);
  }

  async updateUrl(url, callback) {
    await this.setUrl(url, callback(this.getUrl(url)));
  }
}

Object.assign(exports, {DomainStore});

})(typeof exports == 'undefined' ? require.scopes.store = {} : exports);
