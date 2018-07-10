/**
 * `possum` is created with a property `possum.popup` which is an instance of
 * `Server` here. When a popup is openened, it creates an instance of `Popup`,
 * and connects to `possum.popup`. Once connected, the server sends the data of
 * that tab to the popup. Changes on the server are pushed to the popup
 * automatically.
 */
"use strict";

[(function(exports) {

let {connect, document, sendMessage, getURL, React, ReactDOM} = require('./shim'),
  {PopupHandler} = require('./reasons/handlers'),
  {View, Counter} = require('./utils'),
  {Action} = require('./schemes'),
  {GET_DEBUG_LOG, POPUP, USER_URL_DEACTIVATE, USER_HOST_DEACTIVATE, HEADER_DEACTIVATE_ON_HOST} = require('./constants');

const enabledText = `ENABLED`,
    disabledText = `DISABLED`;

const e = React.createElement,
  eFactory = (name) => (props, ...children) => e(name, props, ...children),
  span = eFactory('span'),
  div = eFactory('div'),
  img = eFactory('img'),
  code = eFactory('code'),
  label = eFactory('label'),
  ul = eFactory('ul'),
  li = eFactory('li'),
  input = eFactory('input'),
  checkbox = (props, ...children) => input(Object.assign({type: 'checkbox'}, props, ...children));

function actionIcon({iconPath, attribution}) {
  const className = 'action-icon',
    src = getURL(iconPath);
  return img({className, src, attribution});
}

function actionHtml({action, handler, title, iconPath, attribution, url, key}) {
  const {reason} = action,
    checked = reason != USER_URL_DEACTIVATE,
    onChange = handler;

  return li({className: 'action', key},
    label(
      {title, ['data-reason']: reason},
      checkbox({checked, onChange}),
      actionIcon({action, iconPath, attribution}),
      url
    )
  );
}

function allActions({actions}) {
  let list = [];

  Array.from(actions, ([url, actionInfo], index) => {
    const props = {};
    Object.assign(props, actionInfo, {url, key: index.toString()});
    list.push(actionHtml(props));
  });

  return ul(null, list);
}

function headerHtml({name, count, key}) {
  return li({key},
    code(null, name),
    ` headers blocked from ${count} sources`
  );
}

function headerList({headerCounts}) {
  let list = [];
  Array.from(headerCounts, ([name, count], index) => {
    list.push(headerHtml({name, count, key: index.toString()}));
  });
  return ul({id: 'headers-count-list'}, list);

}

function headersSection({headerCounts, onChange, active}) {
  let children = [];
  children.push(checkbox({id: 'header-checkbox', checked: active, onChange}));
  if (active) {
    children.push('Blocked tracking headers:');
    children.push(headerList({headerCounts}));
  } else {
    children.push('Blocking tracking headers disabled');
  }
  return div(null, ...children);
}

function popupBody({active, urlActions, headerCounts, headerCountsActive, headerHandler}) {
  let children = [];
  if (!active) {
    children.push('Disabled for this site');
  } else if (urlActions.size === 0 && headerCounts.size === 0 && headerCountsActive) {
    children.push('Nothing to do');
  } else {
    let headerProps = {
      headerCounts,
      active: headerCountsActive,
      onChange: headerHandler,
    };
    children.push(div({id: 'headers'},
      headersSection(headerProps)
    ));
    children.push(div({id: 'actions'},
      allActions({actions: urlActions})
    ));
  }
  return e(React.Fragment, null, ...children);
}

function popupHeader({onOff, active}) {
  const onOffElement = e(onOffButton, {onClick: onOff, active});
  return e(React.Fragment,
    null,
    e(branding),
    onOffElement
  );
}

function branding() {
  return div(
    {id: 'branding'},
    img({id: 'logo', src: '/media/popup-icon.png', alt: "I'm a possum"}),
    span({id: 'title'}, 'Privacy Possum')
  );
}

function onOffButton({active, onClick}) {
  const id = 'on-off',
    title = `click to ${active ? 'disable' : 'enable'} for this site`;

  return div(
    {id, onClick, title},
    span({id: 'on-off-text', className: 'grey'}, active ? enabledText : disabledText),
    div({id: 'on-off-button'}, img({src: getURL(`/media/logo-${active ? 'active' : 'inactive'}-100.png`)}))
  );
}

/*** REACT STUFF ABOVE HERE **/

class Popup {
  constructor(tabId) {
    this.urlActions = new Map();
    this.handler = new PopupHandler();
    this.tabId = tabId;

    this.getClickHandler = this.handler.getFunc.bind(this.handler);

    $('debug-link').onclick = this.debug.bind(this);

    this.renderHeader(false);
  }

  renderHeader(active) {
    let ph = popupHeader({onOff: this.onOff.bind(this), active});
    return new Promise((resolve) => ReactDOM.render(ph, $('title-bar'), resolve));
  }

  renderBody() {
    const {active, urlActions, headerCounts, headerCountsActive} = this,
      headerHandler = this.headerHandler.bind(this),
      pb = popupBody({active, urlActions, headerCounts, headerCountsActive, headerHandler});
    return new Promise((resolve) => ReactDOM.render(pb, $('base'), resolve));
  }

  connect() {
    this.port = connect({name: POPUP});
    this.view = new View(this.port, ({active, actions, headerCounts, headerCountsActive}) => {
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
      this.show();
    });
    return this.view.ready;
  }

  getActionInfo(action) {
    let info = this.handler.getInfo(action.reason),
      title = info.message,
      iconPath = info.icon, {attribution} = info;

    if (action.reason == USER_URL_DEACTIVATE) {
      let {reason} = action.getData('deactivatedAction');
      info = this.handler.getInfo(reason);
      iconPath = info.icon, {attribution} = info;
    }
    return {iconPath, title, attribution};
  }

  updateUrlActions(actions) {
    this.urlActions = new Map();
    actions.forEach(([url, action]) => {
      action = Action.coerce(action);
      const handler = this.getClickHandler(action.reason, [url, this.tabId]),
        {title, iconPath, attribution} = this.getActionInfo(action);
      this.urlActions.set(url, {action, handler, title, iconPath, attribution});
    });
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

  show() {
    this.renderHeader(this.active);
    this.renderBody();
  }

  getHandlers(actionsUrls) {
    let out = [];
    actionsUrls.forEach((action, url) => {
      out.push([action, url, this.getClickHandler(action.reason, [url])]);
    });
    return out;
  }
}


function $(id) {
  return document.getElementById(id);
}

Object.assign(exports, {Popup, $});

})].map(func => typeof exports == 'undefined' ? define('/popup', func) : func(exports));
