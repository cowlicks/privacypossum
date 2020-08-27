import * as constants from './constants.js';
import {Tabs} from './tabs.js';
import {Store} from './store.js';
import {Reasons, reasonsArray} from './reasons/reasons.js';
import {Handler, MessageHandler} from './reasons/handlers.js';
import {WebRequest} from './webrequest.js';
import {Server as PopupServer} from './popup_server.js';
import {prettyLog, log} from './utils.js';

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

export {Possum};
