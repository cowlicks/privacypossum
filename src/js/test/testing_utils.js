"use strict"

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

Object.assign(exports, {Mock, stub, stubber});
