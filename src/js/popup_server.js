"use strict";

[(function(exports) {

let {onConnect} = require('./shim'),
    {POPUP} = require('./constants'),
    {Model, currentTab} = require('./utils');

class Server {
  constructor(tabs) {
    this.tabs = tabs;
    this.connections = new Map();
  }

  start() {
    onConnect.addListener(port => {
      if (port.name === POPUP) {
        currentTab().then(tab => {
          let model = new Model(port, this.tabs.getTab(tab.id));
          this.connections.set(tab.id, model);
          port.onDisconnect.addListener(() => {
            this.connections.delete(tab.id);
            model.delete();
          });
        });
      }
    });
  }
}

Object.assign(exports, {Server});

})].map(func => typeof exports == 'undefined' ? define('/popup_server', func) : func(exports));
