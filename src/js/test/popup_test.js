"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {fakePort} = require('../utils'),
  {Tab, Tabs} = require('../tabs'),
  {connect, tabsQuery} = require('../shim'),
  {Model, View, Server, Popup} = require('../popup');

describe('popup.js', function() {
  describe('View and Model', function() {
    it('they can talk', function() {
      let [aPort, bPort] = fakePort('test'),
        result,
        changer = {
          addEventListener: func => changer.func = func,
          onChange: () => changer.func(changer.data),
          data: [1, 2, 3],
          change: (x) => {
            changer.data = x;
            changer.onChange();
          }
        };

      new Model(aPort, changer),
      new View(bPort, out => result = out);

      changer.change('hello');
      assert.equal(result, 'hello');
    });
  });

  describe('Popup and Server', function() {
    it('blocked is sent', async function() {
      let tabId = 1,
        url1 = 'https://foo.com/stuff',
        url2 = 'https://bar.com/other',
        tab = new Tab(tabId),
        tabs = new Tabs();

      tabsQuery.tabs = [{id: tabId}]; // mock current tab
      tab.markAction(constants.CANCEL, url1);
      tabs.setTab(tab.id, tab);

      let server = new Server(tabs),
        popup = new Popup(tabId);
      server.start();
      await popup.connect();

      assert.isTrue(popup.blocked.has(url1), 'initial url is blocked');

      tab.markAction(constants.CANCEL, url2);
      assert.isTrue(popup.blocked.has(url2), 'added url is blocked');
    });
  });
});
