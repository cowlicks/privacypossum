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
  {PopupHandler} = require('./reasons/handlers'),
  {Counter} = require('./utils'),
  {POPUP, USER_URL_DEACTIVATE, USER_HOST_DEACTIVATE, HEADER_DEACTIVATE_ON_HOST} = require('./constants');

function show(element) {
  element.className = 'show';
}
function hide(element) {
  element.className = 'hide';
}

function makeCheckbox(checked, handler) {
  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.addEventListener('change', handler, false);
  return checkbox;
}

const noActionsText = `No tracking detected`,
    enabledText = `ENABLED`,
    disabledText = `DISABLED`;

/*
 * View of some remote data represented by a `Model`.
 */
class View {
  constructor(port, onChange) {
    Object.assign(this, {onChange});
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
    this.handler = new PopupHandler();
    this.getClickHandler = this.handler.getFunc.bind(this.handler);
    this.tabId = tabId;
    this.setOnOffHandler();
    $('headerCheckbox').addEventListener('change', this.headerHandler.bind(this), false);
    this.urlActions = new Map();
  }

  connect() {
    this.port = connect({name: POPUP});
    this.view = new View(this.port, ({active, actions, headerCounts}) => {
      if (typeof active !== 'undefined') {
        this.active = active;
      }
      if (actions) {
        this.updateUrlActions(actions);
      }
      if (headerCounts) {
        this.headerCounts = new Counter(headerCounts);
      }
      this.show();
    });
    return this.view.ready;
  }

  updateUrlActions(actions) {
    this.urlActions = new Map();

    actions.forEach(([url, action]) => {
      this.urlActions.set(url, {action, handler: this.getClickHandler(action.reason, [url, this.tabId])});
    });
  }

  setOnOffHandler() {
    $('onOff').onclick = this.onOff.bind(this);
  }

  async onOff() {
    await sendMessage({type: USER_HOST_DEACTIVATE, tabId: this.tabId});
  }

  async headerHandler() {
    await sendMessage({
      type: HEADER_DEACTIVATE_ON_HOST,
      tabId: this.tabId,
      checked: $('headerCheckbox').checked
    });
  }

  show() {
    this.showActive(this.active);
    this.showActions();
  }

  // show the onOff button
  showActive(active, doc = document) {
    let onOff = $('onOff');

    if (onOff.getAttribute('active') === `${active}`) {
      return;
    }

    let button = $('onOff-button'),
      text = $('onOff-text');

    button.innerHTML = text.innerHTML = '';

    onOff.setAttribute('active', `${active}`);
    onOff.title = `click to ${active ? 'disable' : 'enable'} for this site`;


    let img = doc.createElement('img');
    img.src = getURL(`/media/logo-${active ? 'active' : 'inactive'}-100.png`);

    button.appendChild(img);
    text.appendChild(doc.createTextNode(active ? enabledText : disabledText));
  }

  showActions() {
    this.makeHtml();
  }

  getHandlers(actionsUrls) {
    let out = [];
    actionsUrls.forEach((action, url) => {
      out.push([action, url, this.getClickHandler(action.reason, [url])]);
    });
    return out;
  }

  icon(action, doc = document) {
    let reason = (action.reason != USER_URL_DEACTIVATE) ?
      action.reason :
      action.getData('deactivatedAction').reason;

    let {icon, attribution} = this.handler.getInfo(reason);

    let img = doc.createElement('img');
    img.src = getURL(icon);
    img.className = 'actionIcon';
    img.setAttribute('attribution', attribution);
    return img;
  }

  makeHeaderCountHtml(headerCounts, active = true) {
    $('headerCheckbox').checked = active;

    if (!active) {
      show($('headersDisabled'));
      hide($('headersActive'));
      return;
    } else {
      hide($('headersDisabled'));
      show($('headersActive'));
    }

    let ul = document.createElement('ul');
    headerCounts.forEach((count, name) => {
      ul.appendChild(this.headerHtml(name, count));
    });

    $('headersCountList').innerHTML = '';
    $('headersCountList').appendChild(ul);
  }

  makeActionsHtml(actions) {
    let parent = $('actionsList'),
      ul = document.createElement('ul');

    actions.forEach(({action, handler}, url) => {
      ul.appendChild(this.makeActionHtml(action, handler, url));
    });

    parent.innerHTML = '';
    parent.appendChild(ul);
  }

  makeHtml() {
    let {urlActions, headerCounts} = this;
    if (urlActions.size === 0 && headerCounts.size === 0) {
      let empty = document.createElement('div');
      empty.id = 'emptyActions';
      empty.innerText = noActionsText;
      $('actions').innerHTML = '';
      return $('actions').appendChild(empty);
    }

    if (headerCounts.size !== 0) {
      this.makeHeaderCountHtml(headerCounts);
    }

    if (urlActions.size !== 0) {
      this.makeActionsHtml(urlActions);
    }
  }

  headerHtml(name, count) {
    let li = document.createElement('li'),
      msg = `${name} headers blocked from ${count} sources`;
    li.appendChild(document.createTextNode(msg));
    return li;
  }

  makeActionHtml(action, handler, url) {
    let li = document.createElement('li'),
      label = document.createElement('label'),
      checked = action.reason != USER_URL_DEACTIVATE,
      checkbox = makeCheckbox(checked, handler);

    label.appendChild(checkbox);
    label.appendChild(this.icon(action));
    label.appendChild(document.createTextNode(`${url}`));

    li.className = 'action',
      li.appendChild(label);
    return li;
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

Object.assign(exports, {Model, View, Popup, Server, currentTab, $});

})].map(func => typeof exports == 'undefined' ? define('/popup', func) : func(exports));
