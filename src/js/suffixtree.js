"use strict";

(function(exports) {

const SENTINEL = '.',
  TREE_KEY = 'TREE_KEY';


class Tree {
  constructor() {
    this._root = new Map();
    this._keys = new Set();
  }

  static deserialize(string) {
    let out = new Tree();
    out.loadStore(JSON.parse(string));
    return out;
  }

  setItem(key, val) {
    let parts = this.splitter(key),
      len = parts.length,
      node = this._root;

    this._keys.add(key);

    for (let i = 0; i < len; i++) {
      let part = parts[i];
      if (!node.has(part)) {
        node.set(part, new Map());
      }
      node = node.get(part);
    }
    node[SENTINEL] = val;
  }

  getItem(key) {
    let parts = this.splitter(key),
      len = parts.length,
      node = this._root;

    if (!this._keys.has(key)) {
      return undefined;
    }

    for (let i = 0; i < len; i++) {
      let part = parts[i];
      node = node.get(part);
    }
    return node[SENTINEL];
  }

  splitter(splitme) {
    return splitme.split('.').reverse();
  }

  serialize() {
    let data = [];
    this._keys.forEach(key => data.push([key, this.getItem(key)]));
    return JSON.stringify({[TREE_KEY]: data});
  }

  loadStore(data) {
    data[TREE_KEY].forEach(keyValue => this.setItem(...keyValue));
  }
};

Object.assign(exports, {Tree});

})(typeof exports == 'undefined' ? require.scopes.suffixtree = {} : exports);
