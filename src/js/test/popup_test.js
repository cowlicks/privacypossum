"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {fakePort} = require('../utils'),
  {Tab, Tabs} = require('../tabs'),
  {connect} = require('../shim'),
  {Model, View, Server, Popup} = require('../popup');

describe('popup.js', function() {
  describe('View and Model', function() {
    it('they can talk', function() {
      let [aPort, bPort] = fakePort('test'),
        result,
        data = {
          onChange: {
            addEventListener: func => data.func = func,
            doChange: (change) => data.func(change),
          }
        };

      new Model(aPort, data.onChange),
      new View(bPort, out => result = out, ()=>{});

      data.onChange.doChange('result');
      assert.equal(result, 'result');
    });
  });

  describe('Popup and Server', function() {
    it('blocked is sent', async function() {
      let tabId = 1,
        url1 = 'https://foo.com/stuff',
        url2 = 'https://bar.com/other',
        tab = new Tab(tabId),
        tabs = new Tabs();

      tab.markAction(constants.CANCEL, url1);
      tabs.setTab(tab.id, tab);
      connect.sender = {tab};

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
