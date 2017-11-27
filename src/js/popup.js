"use strict";

(function(exports) {

let {connect, onConnect, tabsQuery, getDocument} = require('./shim'),
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
    this.port = connect({name: POPUP});
    this.view = new View(this.port, blocked => {
      this.blocked = new Set(blocked);
      this.show();
    });
    return this.view.ready;
  }

  show() {
    $('blocked').innerHTML = Array.from(this.blocked);
  }
}

class Server {
  constructor(tabs) {
    this.tabs = tabs;
    this.connections = new Map();
  }

  start() {
    onConnect.addListener(port => {
      if (port.name === POPUP) {
        currentTab().then(tab => {
          this.connections.set(tab.id, new Model(port, this.tabs.getTab(tab.id)));
        });
      }
    });
  }
}

function currentTab() {
  return new Promise(resolve => {
    tabsQuery(
      {
        active: true,
        lastFocusedWindow: true,
      },
      (tabs) => resolve(tabs[0])
    );
  });
}

function $(id) {
  return getDocument().getElementById(id);
}

Object.assign(exports, {Model, View, Popup, Server, currentTab});

})(typeof exports == 'undefined' ? require.scopes.popup = {} : exports);
