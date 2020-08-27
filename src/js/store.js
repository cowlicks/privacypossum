import {DiskMap} from './disk_map.js';
import {Tree, splitter} from './suffixtree.js';
import {Domain} from './schemes.js';
import {shim} from './shim.js';
const {URL, Disk} = shim;

class DomainTree extends Tree {
  beforeSet(val) {
    return (val instanceof Domain) ? val : new Domain(val);
  }

  set(key, val) {
    return super.set(key, this.beforeSet(val));
  }
}

class Store {
  constructor(name, disk = Disk.newDisk(), splitter_ = splitter) {
    this.init(name, disk, splitter_);
  }

  init(name, disk, splitter) {
    this.tree = new DomainTree(splitter);
    this.diskMap = new DiskMap(name, disk);
    this.attachMethods();
  }

  static async load(name, disk) {
    let out = new Store(name, disk);
    await out.diskMap.loadKeys();
    for (let key of out.keys) {
      out.tree.set(key, new Domain(await out.diskMap.get(key)));
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

  async delete(key) {
    return this.tree.delete(key) && await this.diskMap.delete(key);
  }

  async set(key, value) {
    this.tree.set(key, value);
    await this.diskMap.set(key, value);
  }

  async update(key, callback) {
    await this.set(key, callback(this.get(key)));
  }

  getDomain(url) {
    url = new URL(url);
    return this.get(url.hostname);
  }

  async setDomain(url, value) {
    url = new URL(url);
    return await this.set(url.hostname, value);
  }

  async deleteDomain(url) {
    url = new URL(url);
    return await this.delete(url.hostname);
  }

  async updateDomain(url, callback) {
    let domain = this.getDomain(url);
    if (typeof domain === 'undefined' || !(domain instanceof Domain)) {
      domain = new Domain();
    }
    return await this.setDomain(url, callback(domain));
  }

  getUrl(url) {
    let {pathname} = new URL(url),
      domain = this.getDomain(url);
    if (domain instanceof Domain) {
      return domain.getPathAction(pathname);
    }
  }

  async setUrl(url, action) {
    await this.updateDomain(url, (domain) => {
      let {pathname} = new URL(url);
      return domain.setPathAction(pathname, action);
    });
  }

  async updateUrl(url, callback) {
    return await this.updateDomain(url, (domain) => {
      let {pathname} = new URL(url);
      return domain.updatePathAction(pathname, callback);
    });
  }

  async deleteUrl(url) {
    return await this.updateDomain(url, (domain) => {
      let {pathname} = new URL(url);
      return domain.deletePath(pathname);
    });
  }
}

export {Store};
