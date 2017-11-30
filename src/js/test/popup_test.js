"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {fakePort} = require('../fakes'),
  {Tab, Tabs} = require('../tabs'),
  {Listener} = require('../utils'),
  {tabsQuery} = require('../shim'),
  {Model, View, Server, Popup} = require('../popup');

describe('popup.js', function() {
  describe('View and Model', function() {
    it('they can talk', function() {
      let [aPort, bPort] = fakePort('test'),
        result,
        data = new Listener();

      data.getData = () => data.x;
      data.x = 'initial';

      new View(aPort, out => result = out);
      new Model(bPort, data),

      assert.equal(result, 'initial');

      data.x = 'new data';
      data.onChange();

      assert.equal(result, 'new data');
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
      tab.markResponse(constants.CANCEL, url1);
      tabs.setTab(tab.id, tab);

      let server = new Server(tabs),
        popup = new Popup(tabId);
      server.start();
      await popup.connect();

      assert.isTrue(popup.blocked.has(url1), 'initial url is blocked');

      tab.markResponse(constants.CANCEL, url2);
      assert.isTrue(popup.blocked.has(url2), 'added url is blocked');
    });
  });
});
