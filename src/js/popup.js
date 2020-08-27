/**
 * `possum` is created with a property `possum.popup` which is an instance of
 * `Server` here. When a popup is openened, it creates an instance of `Popup`,
 * and connects to `possum.popup`. Once connected, the server sends the data of
 * that tab to the popup. Changes on the server are pushed to the popup
 * automatically.
 */

import {shim} from './shim.js';
const  {connect, document, sendMessage, ReactDOM} = shim;
import  {PopupHandler} from './reasons/handlers.js';
import  {View, Counter} from './utils.js';
import  {Action} from './schemes.js';
import  {popupTitleBar, popupBody} from './popup_components.js';
import  {GET_DEBUG_LOG, POPUP, USER_URL_DEACTIVATE, USER_HOST_DEACTIVATE, HEADER_DEACTIVATE_ON_HOST} from './constants.js';

const $ = (id) => document.getElementById(id);
const asyncRender = (component, anchor) => new Promise(async (resolve) => (await ReactDOM).render(component, anchor, resolve));

class Popup {
  constructor(tabId) {
    this.urlActions = new Map();
    this.handler = new PopupHandler();
    this.tabId = tabId;

    $('debug-link').onclick = this.debug.bind(this);

    this.renderHeader(false);
  }

  async renderHeader(active) {
    return asyncRender((await popupTitleBar)({onOff: this.onOff.bind(this), active}), $('title-bar'));
  }

  async renderBody({active, urlActions, headerCounts, headerCountsActive} = this) {
    let pb = (await popupBody)({active, urlActions, headerCounts, headerCountsActive, headerHandler: this.headerHandler.bind(this)});
    return asyncRender(pb, $('base'));
  }

  connect() {
    this.port = connect({name: POPUP});
    this.view = new View(this.port, async ({active, actions, headerCounts, headerCountsActive}) => {
      if (typeof active !== 'undefined') {
        this.active = active;
      }
      if (actions) {
        this.updateUrlActions(actions);
      }
      if (headerCounts) {
        this.headerCounts = new Counter(headerCounts);
      }
      if (typeof headerCountsActive !== 'undefined') {
        this.headerCountsActive = headerCountsActive;
      }
      await this.show();
    });
    return this.view.ready;
  }

  getActionInfo(url, action) {
    action = Action.coerce(action);
    let {message: title, icon: iconPath, attribution} = this.handler.getInfo(action.reason),
      handler = this.handler.getFunc(action.reason, [url, this.tabId]);

    if (action.reason == USER_URL_DEACTIVATE) {
      let {reason} = action.getData('deactivatedAction');
      ({icon: iconPath, attribution} = this.handler.getInfo(reason));
    }
    return [url, {action, iconPath, title, attribution, handler}];
  }

  updateUrlActions(actions) {
    this.urlActions = new Map(
      actions.map(([url, action]) => this.getActionInfo(url, action))
    );
  }

  async onOff() {
    await sendMessage({type: USER_HOST_DEACTIVATE, tabId: this.tabId});
  }

  async headerHandler() {
    await sendMessage({
      type: HEADER_DEACTIVATE_ON_HOST,
      tabId: this.tabId,
      checked: $('header-checkbox').checked
    });
  }

  async debug() {
    await sendMessage({
      type: GET_DEBUG_LOG,
      tabId: this.tabId,
    },
    debugString => {
      console.log(debugString); // eslint-disable-line
    });
  }

  async show() {
    await this.renderHeader(this.active);
    await this.renderBody();
  }

  getHandlers(actionsUrls) {
    let out = [];
    actionsUrls.forEach((action, url) => {
      out.push([action, url, this.getClickHandler(action.reason, [url])]);
    });
    return out;
  }
}

export {Popup, $};
