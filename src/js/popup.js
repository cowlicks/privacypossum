"use strict";

(function(exports) {

let {connect, onConnect} = require('./shim'),
  {POPUP} = require('./constants');


/*
 * View of some remote data represented by a `Model`.
 */
class View {
  constructor(port, onChange) {
    this.ready = new Promise(resolve => {
      port.onMessage.addListener(obj => {
        if (obj.change) {
          onChange(obj.change);
          resolve();
        }
      });
    });
  }
}

/* 
 * Model that sends data changes to a corresponding view.
 *
 * Takes a `port` and an object with an `onChange` and `addEventListener`
 * methods. `onChange` is called directly first to send the initial data.
 */
class Model {
  constructor(port, data) {
    data.addEventListener(change => port.postMessage({change}));
    data.onChange(); // send initial data
  }
}

class Popup {
  constructor(tabId) {
    this.tabId = tabId;
  }

  connect() {
    let self = this,
      onChange = blocked => self.blocked = blocked;
    return new Promise(resolve => {
      self.port = connect({name: POPUP});
      self.view = new View(self.port, onChange,
        (init) => {
          self.blocked = init.blocked;
          resolve();
        });
    });
  }
}

class Server {
  constructor(tabs) {
    this.tabs = tabs;
  }

  start() {
    onConnect.addListener(port => {
      if (port.name === POPUP) {
        new Model(port, this.tabs.getTab(port.sender.tab.id))
      }
    });
  }
}

Object.assign(exports, {Model, View, Popup, Server});

})(typeof exports == 'undefined' ? require.scopes.popup = {} : exports);
