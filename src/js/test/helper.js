"use strict";

/*
 * Clear global state between each test
 *
 * The node extension api's carry state by design (since browsers do) so we
 * clear them between each stateful interface between each test.
 */

const {clearState} = require('./testing_utils'),
  {logger} = require('../utils'),
  {colors} = require('mocha/lib/reporters/base');

colors['pass'] = '32';
colors['error stack'] = '31';


beforeEach(function() {
  logger.print = false;
  clearState();
});
