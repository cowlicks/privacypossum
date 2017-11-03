"use strict";

(function(exports) {

const {DiskMap} = require('./disk_map'),
  {Tree, splitter} = require('./suffixtree'),
  {URL, Disk} = require('./shim');

class StoreTree {
  constructor(name, disk, splitter) {
    this.tree = new Tree(splitter);
    this.diskMap = new DiskMap(name, disk);
    this.attachMethods();
  }

  static async load(name, disk, splitter) {
    let out = new StoreTree(name, disk, splitter);
    await out.diskMap.loadKeys();
    for (let key of out.keys) {
      out.set(key, await out.diskMap.get(key));
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

  async update(key, obj) {
    let value = this.get(key) || {};
    Object.assign(value, obj);
    await this.set(key, value);
  }
}

class DomainTree extends StoreTree {
  static async load(name, disk) {
    return super.load(name, disk, splitter);
  }

  constructor(name) {
    super(name, Disk.newDisk(), splitter);
  }

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

Object.assign(exports, {DomainTree});

})(typeof exports == 'undefined' ? require.scopes.store = {} : exports);
