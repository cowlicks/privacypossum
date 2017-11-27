"use strict";

(function(exports) {

let {connect, onConnect} = require('./shim'),
  {POPUP} = require('./constants');


/*
 * View of some remote data represented by a `Model`.
 */
class View {
  constructor(port, onChange, initFunc) {
    port.onMessage.addListener(({change, init}) => {
      if (change) {
        onChange(change);
      } else if (init) {
        initFunc(init);
      }
    });
    port.postMessage({init: true});
  }
}

/* 
 * Model that sends data changes to a corresponding view.
 *
 * Takes a `port` and an `onChange` object representing some data that has an interface like:
 * onChange = {addEventListener: (change) => ...};
 *
 */
class Model {
  constructor(port, data) {
    port.onMessage.addListener(({init}) => {
      if (init) {
        port.postMessage({init: data});
      }
    });
    data.addEventListener(change => port.postMessage({change}));
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
