"use strict";

/*
 * Clear global state between each test
 *
 * The node extension api's carry state by design (since browsers do) so we
 * clear them between each stateful interface between each test.
 */

import {clearState} from './testing_utils.js';
import {logger} from '../utils.js';
import mochaBase from 'mocha/lib/reporters/base.js';

const {colors} = mochaBase;

colors['pass'] = '32';
colors['error stack'] = '31';


beforeEach(function() {
  logger.print = false;
  clearState();
});
