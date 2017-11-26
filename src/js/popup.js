"use strict";

(function(exports) {

let {connect, onConnect} = require('./shim'),
  {POPUP} = require('./constants');


/*
 * View of some remote data represented by a `Model`.
 */
class View {
  constructor(port, onChange) {
    port.onMessage.addListener(({change}) => onChange(change));
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
  constructor(port, onChange) {
    onChange.addEventListener(change => port.postMessage({change}));
  }
}

class Popup {
  constructor(tabId) {
    this.tabId = tabId;
  }

  connect() {
    this.port = connect({name: POPUP});
    this.view = new View(this.port, (blocked) => {
      this.blocked = blocked;
    });
    return this;
  }
}

class Server {
  constructor(tabs) {
    this.tabs = tabs;
  }

  start() {
    onConnect.addListener(port => {
      if (port.name === POPUP) {
        new Model(port, this.tabs.get(port.sender.tab.id))
      }
    });
  }
}

Object.assign(exports, {Model, View, Popup, Server});

})(typeof exports == 'undefined' ? require.scopes.popup = {} : exports);
