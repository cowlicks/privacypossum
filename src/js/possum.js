"use strict";

(function(exports) {

const {Tabs} = require('./tabs'),
  {DomainTree} = require('./store'),
  {onMessage} = require('./shim'),
  {MessageDispatcher} = require('./messages'),
  {WebRequest} = require('./webrequest');

class Possum {
  constructor() {
    this.tabs = new Tabs();
    this.store = new DomainTree('possum');
    this.webRequest = new WebRequest(this.tabs, this.store);
    this.messageListener = new MessageDispatcher(this.tabs, this.store),
    this.messageListener.start(onMessage);
  }
}

Object.assign(exports, {Possum});

})(typeof exports == 'undefined' ? require.scopes.possum = {} : exports);
