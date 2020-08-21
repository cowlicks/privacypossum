const SENTINEL = '.',
  LABEL = 'label',
  root_label = 'root';

class Node extends Map {
  constructor(label) {
    super();
    this[LABEL] = label;
  }

  setLabelData(data) {
    this[SENTINEL] = data;
  }

  getLabelData() {
    return this[SENTINEL];
  }

  hasLabelData() {
    return this.hasOwnProperty(SENTINEL);
  }

  deleteLableData() {
    return delete this[SENTINEL];
  }

  dangling() { // no data and no children
    return this.size == 0 && !this.hasLabelData();
  }
}

function setAgg(node, part) {
  if (!node.has(part)) {
    node.set(part, new Node(part));
  }
  return node.get(part);
}

function getAgg(node, part) {
  return node.get(part);
}

function deleteAgg(node, part, aggregator) {
  let next = node.get(part);
  aggregator.push(next);
  return next;
}

function branchAgg(node, part, agg) {
  node = node.get(part);
  if (typeof node !== 'undefined' && node.hasLabelData()) {
    agg.set(part, node.getLabelData());
  }
  return node;
};

class Tree {
  constructor(splitter) {
    this.splitter = splitter;
    this._root = new Node(root_label);
  }

  aggregate(key, aggFunc, aggregator) {
    let parts = this.splitter(key),
      len = parts.length,
      node = this._root;

    for (let i = 0; i < len; i++) {
      let part = parts[i];
      node = aggFunc(node, part, aggregator);
      if (typeof node === 'undefined') {
        return undefined;
      }
    }
    return node
  }

  set(key, val) {
    let node = this.aggregate(key, setAgg);
    node.setLabelData(val);
  }

  get(key) {
    let node = this.aggregate(key, getAgg);
    return (typeof node === 'undefined') ? undefined : node.getLabelData();
  }

  delete(key) {
    let branch = [], deleted = false;
    this.aggregate(key, deleteAgg, branch);
    let cur = branch.pop();
    if (typeof cur !== 'undefined' && cur.hasLabelData()) {
      cur.deleteLableData();
      deleted = true;
      while (branch.length > 0 && cur.dangling()) {
        let parent_ = branch.pop();
        parent_.delete(cur[LABEL]);
        cur = parent_;
      }
    }
    return deleted;
  }

  getBranchData(key) {
    let aggregator = new Map();
    let node = this.aggregate(key, branchAgg, aggregator)
    return (typeof node == 'undefined') ? undefined : aggregator;
  }
};

function splitter(splitme) {
  return splitme.split('.').reverse();
}

export {Tree, splitter};
