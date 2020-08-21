import chai from 'chai'; const {assert} = chai;
import {USER_URL_DEACTIVATE} from '../constants.js';
import {Tab, Tabs} from '../tabs.js';
import {blockAction} from '../reasons/reasons.js';
import {setDocumentHtml, useJSDOM} from './testing_utils.js';
import {Server} from '../popup_server.js';
import {Popup, $} from '../popup.js';
import {shim} from '../shim.js';
const {onMessage, tabsQuery, setAsyncImports, document} = shim;
import * as jsdom from 'jsdom';
const {default: {JSDOM}} = jsdom;

before(() => {
  useJSDOM(JSDOM);
});

describe('popup.js', function() {
  beforeEach(async function() {
    await setDocumentHtml('../skin/popup.html');
  });

  describe('header html', function() {
    beforeEach(function() {
      this.tabId = 1;
      this.popup = new Popup(this.tabId);
      this.bodyProps = {active: true, urlActions: new Map(), headerCountsActive: true, headerCounts: new Map()};
      Object.assign(this.popup, this.bodyProps);
    });
    it('inactive', async function() {
      this.popup.headerCountsActive = false;
      await this.popup.renderBody();
      assert.isFalse($('header-checkbox').checked);
    });
    it('headerHandler', async function() {
      this.popup.headerCounts = new Map([[1, 2]]);
      await this.popup.renderBody();
      await this.popup.headerHandler();
      assert.isTrue(onMessage.messages.pop().pop().checked);
    });
    it('headers active', async function() {
      let name = 'headerName', count = 42;
      this.popup.headerCounts = new Map([[name, count]]);
      await this.popup.renderBody();
      assert.isTrue($('header-checkbox').checked);
      assert.include($('headers-count-list').innerHTML, name);
      assert.include($('headers-count-list').innerHTML, count);
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
        assert.isTrue(this.popup.active);

        this.popup.view.onChange({active: false});

        assert.isFalse(this.popup.active, false);
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
