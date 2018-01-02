"use strict";

const assert = require('chai').assert,
  {fakePort} = require('../fakes'),
  {Tab, Tabs} = require('../tabs'),
  {Listener} = require('../utils'),
  {tabsQuery} = require('../shim'),
  {blockAction} = require('../reasons/reasons'),
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
    let url1 = 'https://foo.com/stuff',
      url2 = 'https://bar.com/other';
    beforeEach(async function() {
      let tabId = 1;
      this.tab = new Tab(tabId);
      this.tabs = new Tabs();

      tabsQuery.tabs = [{id: tabId}]; // mock current tab
      this.tab.markAction(blockAction, url1);
      this.tabs.setTab(this.tab.id, this.tab);

      this.server = new Server(this.tabs);
      this.popup = new Popup(tabId);

      this.server.start();
      await this.popup.connect();
    })

    it('actions are sent', function() {
      assert.isTrue(this.popup.actions.has(url1), 'initial url is blocked');

      this.tab.markAction(blockAction, url2);
      assert.isTrue(this.popup.actions.has(url2), 'added url is blocked');
    });

    it('active is sent', function() {
      assert.isTrue(this.popup.active);

      this.tab.toggleActiveState();
      assert.isFalse(this.popup.active);
    });
  });
});
