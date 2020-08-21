// Initialize the extension. This is only run in the browser.

import {Possum} from './possum.js';
import {shim} from './shim.js';

Possum.load(shim.Disk).then(possum => window['possum'] = possum);
