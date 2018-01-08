"use strict"

const notCookie = {name: 'a', value: 'b'},
  cookie = {name: 'Cookie', value: 'c'};

function clone(val) {
  return JSON.parse(JSON.stringify(val));
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
    Object.assign(this, details);
  }
  toSender(url) {
    return toSender(this, url);
  }
  copy() {
    return JSON.parse(JSON.stringify(this));
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

Object.assign(exports, {watchFunc, Mock, stub, stubber, Details, details, clone, cookie, notCookie, toSender});
