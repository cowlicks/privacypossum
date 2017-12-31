"use strict";
// Initialize the extension. This is only run in the browser.

const {Possum} = require('./possum'),
  {Disk} = require('./shim');

Possum.load(Disk).then(possum => window['possum'] = possum);
