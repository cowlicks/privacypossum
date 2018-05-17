"use strict";

[(function(exports) {

const constants = require('./constants'),
  {Tabs} = require('./tabs'),
  {Store} = require('./store'),
  {Reasons, reasonsArray} = require('./reasons/reasons'),
  {Handler, MessageHandler} = require('./reasons/handlers'),
  {WebRequest} = require('./webrequest'),
  PopupServer = require('./popup_server').Server,
  {prettyLog, log} = require('./utils');

class Possum {
  constructor(store = new Store(constants.DISK_NAME)) {
    const tabs = new Tabs(),
      reasons = Reasons.fromArray(reasonsArray),
      handler = new Handler(tabs, store, reasons),
      webRequest = new WebRequest(tabs, store, handler),
      messageListener = new MessageHandler(tabs, store, reasons),
      popup = new PopupServer(tabs);

    tabs.startListeners();
    webRequest.startListeners()
    messageListener.startListeners();
    popup.start();

    Object.assign(this, {store, tabs, reasons, handler, webRequest, messageListener, popup});
    log('Woop woop possum party!!!');
  }

  static async load(disk) {
    return new Possum(await Store.load(constants.DISK_NAME, disk));
  }

  prettyLog() {
    return prettyLog();
  }
}

Object.assign(exports, {Possum});

})].map(func => typeof exports == 'undefined' ? define('/possum', func) : func(exports));
