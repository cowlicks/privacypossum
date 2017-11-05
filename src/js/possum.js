"use strict";

(function(exports) {

const constants = require('./constants'),
  {Tabs} = require('./tabs'),
  {DomainStore} = require('./store'),
  {onMessage, onBeforeRequest} = require('./shim'),
  {MessageDispatcher} = require('./messages'),
  {WebRequest} = require('./webrequest');

class Possum {
  constructor(store) {
    if (typeof store === 'undefined') {
      store = new DomainStore(constants.DISK_NAME);
    }
    this.store = store;

    this.tabs = new Tabs();

    this.webRequest = new WebRequest(this.tabs, this.store);
    this.webRequest.start(onBeforeRequest);

    this.messageListener = new MessageDispatcher(this.tabs, this.store),
    this.messageListener.start(onMessage);
  }

  static async load(disk) {
    return new Possum(await DomainStore.load(constants.DISK_NAME, disk));
  }
}

Object.assign(exports, {Possum});

})(typeof exports == 'undefined' ? require.scopes.possum = {} : exports);
