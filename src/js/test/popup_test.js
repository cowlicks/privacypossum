"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {fakePort} = require('../utils'),
  {Tab} = require('../tabs'),
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
      new View(bPort, out => result = out);

      data.onChange.doChange('result');
      assert.equal(result, 'result');
    });
  });

  describe('Popup and Server', function() {
    it('blocked is sent', function() {
      let tabId = 1,
        url = 'https://foo.com/stuff',
        tab = new Tab(tabId),
        tabs = new Map([[tabId, tab]]);

      connect.sender = {tab};
      let server = new Server(tabs),
        popup = new Popup(tabId);
      server.start();
      popup.connect();

      tab.markAction(constants.CANCEL, url);
      assert.isTrue(popup.blocked.has(url));
    });
  });
});
