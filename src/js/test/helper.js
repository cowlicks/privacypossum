const {onConnect, tabsOnMessage, onMessage, tabsQuery} = require('../shim');

beforeEach(function() {
  tabsOnMessage.clear();
  onMessage.clear();
  onConnect.clear();
  tabsQuery.tabs = [];
});
