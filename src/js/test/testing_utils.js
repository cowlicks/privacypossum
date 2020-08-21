import {shim} from '../shim.js';
import {Popup} from '../popup.js';
import {annotateDetails} from '../webrequest.js';


const {tabsExecuteScript, onNavigationCommitted, onConnect, tabsOnMessage, onMessage, tabsQuery, getAllFrames} = shim;

const notCookie = {name: 'a', value: 'b'},
  cookie = {name: 'Cookie', value: 'c'};

function clearState() {
  tabsExecuteScript.clear();
  onNavigationCommitted.clear();
  tabsOnMessage.clear();
  onMessage.clear();
  onConnect.clear();
  tabsQuery.clear();
  getAllFrames.clear();
}

async function setDocumentHtml(path) {
  let {default: {JSDOM}} = await import('jsdom');
  let {shim: {document}} = await import('../shim.js');
  let newDoc = (await JSDOM.fromFile(path)).window.document;
  (await document).documentElement.innerHTML = newDoc.documentElement.innerHTML;
}

function useJSDOM(JSDOM) {
  shim.document.setBase = new JSDOM().window.document;
}


async function makePopup(tabId) {
  tabsQuery.tabs = [{id: tabId}];
  let popup = new Popup(tabId);
  await popup.connect();
  return popup;
}

function clone(val) {
  return JSON.parse(JSON.stringify(val));
}

function makeGetterSetterUpdater(obj, suffix) {
  return ['get', 'set', 'update'].map(prefix => obj[prefix + suffix].bind(obj));
}

async function testGetSetUpdate(obj, suffix, [k1, v1, update] = ['k1', 'v1', 'update']) {
  const [getter, setter, updater] = makeGetterSetterUpdater(obj, suffix),
   {default: {assert}} = await import('chai');

  setter(k1, v1);
  assert.deepEqual(getter(k1), v1);

  let before = await new Promise(resolve => {
    updater(k1, value => {
      resolve(value);
      return update;
    });
  });
  assert.equal(before, v1);
  assert.equal(getter(k1), update);
}

function Mock(retval) {
  let out = function() {
    out.calledWith = Array.from(arguments);
    out.called = true;
    out.ncalls += 1;
    return retval;
  }
  out.called = false;
  out.ncalls = 0;
  return out;
}

function watchFunc(func) {
  function outFunc() {
    outFunc.inputs.push(Array.from(arguments));
    let res = func.apply(this, arguments);
    outFunc.outputs.push(res);
    return res;
  }
  outFunc.inputs = [], outFunc.outputs = [];
  return outFunc;
}

function stub(name, value) {
  let parts = name.split('.'),
    last = parts.pop(),
    part = global;
  parts.forEach(partName => {
    if (!part.hasOwnProperty(partName)) {
      part[partName] = {};
    }
    part = part[partName];
  });
  part[last] = value;
}

function stubber(namesValues) {
  namesValues.forEach(nameValue => {
    stub(...nameValue);
  });
}


function toSender(details, url) {
  if (typeof url === 'undefined') {
    url = details.url;
  }
  return {tab: {id: details.tabId}, url, frameId: details.frameId};
}

class Details {
  constructor (details) {
    annotateDetails(details);
    Object.assign(this, details);
  }
  toSender(url) {
    return toSender(this, url);
  }
  copy() {
    return new Details(JSON.parse(JSON.stringify(this)));
  }
}

const main_frame = new Details({
    frameId: 0,
    url: 'https://firstparty.com/',
    tabId: 1,
    parentFrameId: -1,
    type: 'main_frame',
  }),
  sub_frame = new Details({
    frameId: 1,
    url: 'about:blank',
    tabId: 1,
    parentFrameId: 0,
    type: 'sub_frame',
  }),
  first_party_script = new Details({
    frameId: 0,
    url: 'https://firstparty.com/script.js',
    tabId: 1,
    type: 'script',
  }),
  // todo consolidate script and third_party
  script = new Details({
    frameId: 0,
    url: 'https://foo.com/otherscript.js',
    tabId: 1,
    type: 'script',
  }),
  third_party = new Details({
    frameId: 0,
    url: 'https://third-party.com/stuff.js',
    tabId: 1,
    type: 'script',
  });

const details = {main_frame, sub_frame, first_party_script, script, third_party};

export {setDocumentHtml, watchFunc, Mock, stub, stubber, Details, details, clone, cookie, notCookie, toSender, testGetSetUpdate, makePopup, clearState, useJSDOM};
