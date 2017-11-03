"use strict";

(function(exports) {

const constants = require('./constants'),
  {Tabs} = require('./tabs'),
  {DomainTree} = require('./store'),
  {onMessage} = require('./shim'),
  {MessageDispatcher} = require('./messages'),
  {WebRequest} = require('./webrequest');

class Possum {
  constructor() {
    this.store = new DomainTree(constants.DISK_NAME);

    this.tabs = new Tabs();

    this.webRequest = new WebRequest(this.tabs, this.store);
    this.messageListener = new MessageDispatcher(this.tabs, this.store),
    this.messageListener.start(onMessage);
  }

  static async load(disk) {
    let out = new Possum();
    out.store = await DomainTree.load(constants.DISK_NAME, disk);
    return out;
  }

}

Object.assign(exports, {Possum});

})(typeof exports == 'undefined' ? require.scopes.possum = {} : exports);
