"use strict";

[(function(exports) {

const constants = require('./constants'),
  {Tabs} = require('./tabs'),
  {DomainStore} = require('./store'),
  {Reasons, reasonsArray} = require('./reasons/reasons'),
  {Handler, MessageHandler} = require('./reasons/handlers'),
  {WebRequest} = require('./webrequest'),
  PopupServer = require('./popup_server').Server;

class Possum {
  constructor(store = new DomainStore(constants.DISK_NAME)) {
    this.store = store;

    this.tabs = new Tabs();
    this.tabs.startListeners();

    this.reasons = Reasons.fromArray(reasonsArray);

    this.handler = new Handler(this.tabs, this.store, this.reasons);

    this.webRequest = new WebRequest(this.tabs, this.store, this.handler);
    this.webRequest.start()

    this.messageListener = new MessageHandler(this.tabs, this.store, this.reasons),
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
