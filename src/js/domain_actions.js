"use strict";

(function(exports) {

const {DiskMap} = require('./disk_map'),
  {Tree} = require('./suffixtree');

class DomainTree {
  constructor(name, disk, splitter) {
    this.tree = new Tree(splitter);
    this.diskMap = new DiskMap(name, disk);
    this.attachMethods();
  }

  static async load(name, disk, splitter) {
    let out = new DomainTree(name, disk, splitter);
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

Object.assign(exports, {DomainTree});

})(typeof exports == 'undefined' ? require.scopes.domain_actions = {} : exports);
