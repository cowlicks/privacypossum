"use strict";
// Initialize the extension. This is only run in the browser.

import {Possum} from './possum.js';
import {shims} from './shim.js';

Possum.load(shims.Disk).then(possum => window['possum'] = possum);
