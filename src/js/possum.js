"use strict";

[(function(exports) {

const constants = require('./constants'),
  {Tabs} = require('./tabs'),
  {DomainStore} = require('./store'),
  {onRemoved} = require('./shim'),
  {MessageHandler} = require('./reasons/handlers'),
  {WebRequest} = require('./webrequest'),
  PopupServer = require('./popup').Server;

class Possum {
  constructor(store = new DomainStore(constants.DISK_NAME)) {
    this.store = store;

    this.tabs = new Tabs();
    this.tabs.startListeners();

    this.webRequest = new WebRequest(this.tabs, this.store);
    this.webRequest.start()

    this.messageListener = new MessageHandler(this.tabs, this.store),
    this.messageListener.startListeners();

    this.popup = new PopupServer(this.tabs);
    this.popup.start();
  }

  static async load(disk) {
    return new Possum(await DomainStore.load(constants.DISK_NAME, disk));
  }
}

Object.assign(exports, {Possum});

})].map(func => typeof exports == 'undefined' ? define('/possum', func) : func(exports));
