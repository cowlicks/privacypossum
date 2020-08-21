import {shim} from './shim.js';
import {USER_URL_DEACTIVATE} from './constants.js';

const {getURL, React} = shim;

const pathToReact = './external/react/react.production.min.js';
const text = {enabled: 'ENABLED', disabled: 'DISABLED'};

const merge = (...objs) => Object.assign({}, ...objs);

function Deferred() {
  const o = {};
  const p = new Promise((resolve, reject) => Object.assign(o, {resolve, reject}));
  return Object.assign(p, o);
}


const popupTitleBar = Deferred(),
  popupBody = Deferred();

(async () => {
  const {createElement, Fragment} = (await React);


  const e = createElement,
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

  popupTitleBar.resolve(
    ({onOff: onClick, active}) => {
      return e(Fragment,
        null,
        branding(),
        onOffButton({onClick, active})
      );
    }
  );

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

  popupBody.resolve(
    ({active, urlActions, headerCounts, headerCountsActive, headerHandler}) => {
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
      return e(Fragment, null, ...children);
    }
  );
})();

export {popupTitleBar, popupBody};
