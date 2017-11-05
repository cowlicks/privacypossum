"use strict";

const {Possum} = require('./possum'),
  {Disk} = require('./shim');

Possum.load(Disk).then(possum => window['possum'] = possum);
