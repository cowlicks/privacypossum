"use strict";

const assert = require('chai').assert,
  {USER_URL_DEACTIVATE} = require('../constants'),
  {Tab, Tabs} = require('../tabs'),
  {onMessage, tabsQuery} = require('../shim'),
  {blockAction} = require('../reasons/reasons'),
  {setDocument} = require('./testing_utils'),
  {Server} = require('../popup_server'),
  {Popup, $} = require('../popup');

describe('popup.js', function() {
  beforeEach(async function() {
    await setDocument('../skin/popup.html');
  });

  describe('header html', function() {
    beforeEach(function() {
      this.tabId = 1;
      this.popup = new Popup(this.tabId);
    });
    it('inactive', function() {
      this.popup.allHeadersHtml(new Map(), false);
      assert.isFalse($('headerCheckbox').checked);
    });
    it('headerHandler', async function() {
      this.popup.allHeadersHtml(new Map(), true);
      await this.popup.headerHandler();
      assert.isTrue(onMessage.messages.pop().pop().checked);
    });
    it('headers active', function() {
      let name = 'headerName',
        count = 42,
        headerCounts = new Map([[name, count]]);
      this.popup.allHeadersHtml(headerCounts, true);
      assert.isTrue($('headerCheckbox').checked);
      assert.include($('headersCountList').innerHTML, name);
      assert.include($('headersCountList').innerHTML, count);
    });
  });

  describe('Popup and Server', function() {
    let url1 = 'https://foo.com/stuff',
      url2 = 'https://bar.com/other';
    beforeEach(async function() {
      this.tabId = 1;
      this.tab = new Tab(this.tabId);
      this.tabs = new Tabs();

      tabsQuery.tabs = [{id: this.tabId}]; // mock current tab
      this.tab.markAction(blockAction, url1);
      this.tabs.setTab(this.tab.id, this.tab);

      this.server = new Server(this.tabs);
      this.popup = new Popup(this.tabId);

      this.server.start();
      await this.popup.connect();
    });

    describe('action click handlers', function() {
      it('active is set', async function() {
        assert.deepEqual([this.popup.active, $('onOff').getAttribute('active')], [true, 'true']);

        this.popup.view.onChange({active: false});

        assert.deepEqual([this.popup.active, $('onOff').getAttribute('active')], [false, 'false']);
      });
      it('sets click handlers', async function() {
        let popup = this.popup;

        assert.isTrue(popup.urlActions.has(url1));
        assert.deepEqual(popup.urlActions.get(url1).action, blockAction);

        popup.urlActions.get(url1).handler();

        let url = url1, type = USER_URL_DEACTIVATE,
          res = onMessage.messages.pop().pop();
        assert.include(res, {url, type});
      });
    });

    describe('updates are sent', function() {
      it('actions are sent', function() {
        assert.isTrue(this.popup.urlActions.has(url1), 'initial url is blocked');

        this.tab.markAction(blockAction, url2);
        assert.isTrue(this.popup.urlActions.has(url2), 'added url is blocked');
      });

      it('active is sent', function() {
        assert.isTrue(this.popup.active);

        this.tab.toggleActiveState();
        assert.isFalse(this.popup.active);
      });
    });
  });
});
