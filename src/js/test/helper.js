"use strict";

/*
 * Clear global state between each test
 *
 * The node extension api's carry state by design (since browsers do) so we
 * clear them between each stateful interface between each test.
 */

const {clearState} = require('./testing_utils');

beforeEach(function() {
  clearState();
});
