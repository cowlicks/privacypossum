/*
 * Clear global state between each test
 *
 * The node extension api's carry state by design (since browsers do) so we
 * clear them between each stateful interface between each test.
 */

const {onConnect, tabsOnMessage, onMessage, tabsQuery} = require('../shim');

beforeEach(function() {
  tabsOnMessage.clear();
  onMessage.clear();
  onConnect.clear();
  tabsQuery.clear();
});
