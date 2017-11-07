"use strict"

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


class Details {
  constructor (details) {
    Object.assign(this, details);
  }
  toSender(url) {
    if (typeof url === 'undefined') {
      url = this.url;
    }
    return {tab: {id: this.tabId}, url, frameId: this.frameId};
  }
}

const main_frame = new Details({
    frameId: 0,
    url: 'https://google.com/',
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
  script = new Details({
    frameId: 0,
    url: 'https://foo.com/somescript.js',
    tabId: 1,
    type: 'script',
  });

const details = {main_frame, sub_frame, script};

Object.assign(exports, {Mock, stub, stubber, details, clone});
