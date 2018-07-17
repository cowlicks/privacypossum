"use strict";

[(function(exports) {

let {getURL, React} = require('./shim'),
    {USER_URL_DEACTIVATE} = require('./constants');

const text = {enabled: 'ENABLED', disabled: 'DISABLED'};

const merge = (...objs) => Object.assign({}, ...objs);

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
  checkbox = (props, ...children) => input(merge({type: 'checkbox'}, props), ...children);

function branding() {
  return div(
    {id: 'branding'},
    img({id: 'logo', src: '/media/popup-icon.png', alt: "I'm a possum"}),
    span({id: 'title'}, 'Privacy Possum')
  );
}

function onOffButton({active, onClick}) {
  return div(
    {id: 'on-off', title: `click to ${active ? 'disable' : 'enable'} for this site`, onClick},
    span({id: 'on-off-text', className: 'grey'}, active ? text.enabled : text.disabled),
    div({id: 'on-off-button'}, img({src: getURL(`/media/logo-${active ? 'active' : 'inactive'}-100.png`)}))
  );
}

function popupTitleBar({onOff: onClick, active}) {
  return e(React.Fragment,
    null,
    branding(),
    onOffButton({onClick, active})
  );
}

function headerHtml({name, count, key}) {
  return li({key},
    code(null, name),
    ` headers blocked from ${count} sources`
  );
}

function headerList({headerCounts}) {
  return ul({id: 'headers-count-list'},
    Array.from(headerCounts, ([name, count], index) => {
      return headerHtml({name, count, key: index.toString()});
    })
  )
}

function headersSection({headerCounts, headerCountsActive: active, headerHandler: onChange}) {
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

function actionIcon({iconPath, attribution}) {
  return img({className: 'action-icon', src: getURL(iconPath), attribution});
}

function actionHtml({action, handler: onChange, title, iconPath, attribution, url, key}) {
  const checked = action.reason != USER_URL_DEACTIVATE;

  return li({className: 'action', key},
    label({title, ['data-reason']: action.reason},
      checkbox({checked, onChange}),
      actionIcon({action, iconPath, attribution}),
      url
    )
  );
}

function allActions({actions}) {
  return ul(null,
    Array.from(actions, ([url, actionInfo], index) => {
      return actionHtml(merge(actionInfo, {url, key: index.toString()}));
    })
  );
}

function popupBody({active, urlActions, headerCounts, headerCountsActive, headerHandler}) {
  let children = [];
  if (!active) {
    children.push('Disabled for this site');
  } else if (urlActions.size === 0 && headerCounts.size === 0 && headerCountsActive) {
    children.push('Nothing to do');
  } else {
    children.push(div({id: 'headers'},
      headersSection({headerCounts, headerCountsActive, headerHandler})
    ));
    children.push(div({id: 'actions'},
      allActions({actions: urlActions})
    ));
  }
  return e(React.Fragment, null, ...children);
}

Object.assign(exports, {popupTitleBar, popupBody});

})].map(func => typeof exports == 'undefined' ? define('/popup_components', func) : func(exports));
