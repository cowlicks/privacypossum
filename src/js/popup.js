/**
 * `possum` is created with a property `possum.popup` which is an instance of
 * `Server` here. When a popup is openened, it creates an instance of `Popup`,
 * and connects to `possum.popup`. Once connected, the server sends the data of
 * that tab to the popup. Changes on the server are pushed to the popup
 * automatically.
 */
"use strict";

[(function(exports) {

let {connect, onConnect, tabsQuery, document, sendMessage, getURL} = require('./shim'),
  {POPUP, USER_HOST_DEACTIVATE} = require('./constants');


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
 * Takes a `port` and an object with an `onChange` and `addListener`
 * methods. `onChange` is called directly first to send the initial data.
 *
 * todo: add a mixin that conforms to changer interface
 */
class Model {
  constructor(port, data) {
    this.data = data;
    this.func = change => port.postMessage({change});
    data.addListener(this.func);
    data.onChange(); // send initial data
  }

  delete() {
    this.data.removeListener(this.func);
  }
}

class Popup {
  constructor(tabId) {
    this.tabId = tabId;
    this.setHandlers();
  }

  connect() {
    this.port = connect({name: POPUP});
    this.view = new View(this.port, ({active, actions}) => {
      this.active = active;
      this.actions = new Map(actions);
      this.show();
    });
    return this.view.ready;
  }

  setHandlers() {
    $('onOff').onclick = this.onOff.bind(this);
  }

  onOff() {
    sendMessage({type: USER_HOST_DEACTIVATE, tabId: this.tabId});
  }

  show() {
    this.showActive(this.active);
    this.showActions(this.actions);
  }

  showActive(active) {
    let onOff = $('onOff');

    if (onOff.getAttribute('active') === `${active}`) {
      return;
    }

    onOff.setAttribute('active', `${active}`);
    onOff.title = `click to ${active ? 'deactivate' : 'activate'} for this site`;

    let doc = document,
      img = doc.createElement('img');

    img.src = getURL(`/media/logo-${active ? 'active' : 'inactive'}-100.png`);
    img.height = 100, img.width = 100;

    $('onOff').innerHTML = img.outerHTML;
  }

  showActions(actions) {
    let doc = document,
      ul = doc.createElement('ul');

    actions.forEach((value, key) => {
      let li = doc.createElement('li');
      li.innerHTML = `url: ${key} with action: ${value.reason}`;
      ul.appendChild(li);
    });

    $('actions').innerHTML = '';
    $('actions').appendChild(ul);
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
  return document.getElementById(id);
}

Object.assign(exports, {Model, View, Popup, Server, currentTab});

})].map(func => typeof exports == 'undefined' ? define('/popup', func) : func(exports));
