import chai from 'chai'; const {assert} = chai;
import {BLOCK, REMOVE_ACTION} from '../constants.js';
import {shim} from '../shim.js';
const {onRemoved, getBadgeText, onNavigationCommitted, getAllFrames, tabsQuery, tabsExecuteScript} = shim;
import {Action} from '../schemes.js';
import {cookie} from './testing_utils.js';
import {Tab, Tabs} from '../tabs.js';

const tabId = 1,
  firstParty = 'https://google.com/', thirdParty = 'https://third.com/',
  main_frame = {frameId: 0, url: firstParty, tabId, parentFrameId: -1, type: 'main_frame'},
  sub_frame = {frameId: 1, url: 'about:blank', tabId, parentFrameId: 0, type: 'sub_frame'};

describe('tabs.js', function() {
  describe('Tabs', function() {
    beforeEach(function() {
      this.tabs = new Tabs();
      this.tabs.addResource(main_frame);
      this.tabs.addResource(sub_frame);
      this.tab = this.tabs.getTab(main_frame.tabId);
    });
    describe('#getCurrentData', function() {
      it('does not get frames from "discarded" tabs', async function() {
        let discarded = true, id = 2, url = 'https://url.com/';
        tabsQuery.tabs = [{id, discarded, url}];
        getAllFrames.data = [
          {frameId: 0, parentFrameId: -1, url},
          {frameId: 1, parentFrameId: 0, url: url}
        ];

        await this.tabs.getCurrentData();
        assert.isUndefined(this.tabs.getFrame(id, 1));
      });
    });
    describe('#isRequestThirdParty', function() {
      it('is first party if main_frame', function() {
        let details = {type: 'main_frame'};
        assert.isFalse(this.tabs.isRequestThirdParty(details));
      });
      it('no initiator', function() {
        let details = {tabId: 1, urlObj: new URL(thirdParty)};
        assert.isTrue(this.tabs.isRequestThirdParty(details));
      });
      it('has initiator', function() {
        let isFirst = {initiator: firstParty, urlObj: new URL(firstParty)},
          isThird = {initiator: firstParty, urlObj: new URL(thirdParty)};
        assert.isFalse(this.tabs.isRequestThirdParty(isFirst));
        assert.isTrue(this.tabs.isRequestThirdParty(isThird));
      });
      it('no initiator tabId = -1', function() {
        assert.isFalse(this.tabs.isRequestThirdParty({tabId: -1}));
      });
      it('no initiator, no prexisting data about tab', function() {
        this.tabs = new Tabs();
        let details = {tabId: 1, urlObj: new URL(thirdParty)};
        assert.isFalse(this.tabs.isRequestThirdParty(details));
      });
    });

    it('#getTabUrl', function() {
      assert.equal(this.tabs.getTabUrl(1), 'https://google.com/');
      assert.isUndefined(this.tabs.getTabUrl('not present'));
    });

    it('#getFrameUrl', function() {
      assert.equal(this.tabs.getFrameUrl(1, 1), 'about:blank');
    });

    it('#removeTab', function() {
      assert.isTrue(this.tabs.removeTab(main_frame.tabId));
    });

    describe('#onNavigationCommitted', function() {
      let {tabId, frameId, url} = main_frame;
      beforeEach(async function() {
        this.tabs.startListeners();
      });

      it('injects when onNavigationComitted fires', async function() {
        await onNavigationCommitted.sendMessage({tabId, frameId, url});
        assert.isTrue(tabsExecuteScript.onMessage.messages.length > 0);
      });
      it('does not inject when tab is deactivated', async function() {
        this.tab.setActiveState(false)
        await onNavigationCommitted.sendMessage({tabId, frameId, url});
        assert.equal(tabsExecuteScript.onMessage.messages.length, 0);
      });
    });

    describe('#startListeners', function() {
      it('removes tabs on message', async function() {
        this.tabs.startListeners();
        assert.isTrue(this.tabs.hasTab(main_frame.tabId));
        await onRemoved.sendMessage(main_frame.tabId)
        assert.isFalse(this.tabs.hasTab(main_frame.tabId));
      })
    });

    describe('#hasResource', function() {
      let resource = {tabId, frameId: 0, url: 'https://google.com/foo.js', type: 'script'}
      it('no resource', function() {
        assert.isFalse(this.tabs.hasResource(resource));
      });

      it('with resource', function() {
        this.tabs.addResource(resource);
        assert.isTrue(this.tabs.hasResource(resource));
      });
    })

    describe('Tab', function() {
      const tabId = 1,
        url = 'https://example.com';

      beforeEach(function() {
        this.tab = new Tab(tabId);
      })
      it('merge', async function() {
        let block = new Action(BLOCK),
          {tab} = this,
          removed = [{name: 'foo'}, {name: 'bar'}],
          tabId2 = 2, url2 = 'https://other.com',
          removed2 = [{name: 'foo'}, {name: 'qux'}],
          tab2 = new Tab(tabId2);

        await tab.markAction(block, url);
        await tab.markHeaders(removed);

        await tab2.markAction(block, url2);
        await tab2.markHeaders(removed2);

        tab.merge(tab2);
        assert.deepEqual(Array.from(tab.actions), [[url, block]], 'url isnt overwritten');
        assert.deepEqual(Array.from(tab.headerCounts), [['foo', 2], ['bar', 1], ['qux', 1]])
      });
      describe('#markAction', function() {
        it('adds actions', async function() {
          await this.tab.markAction(new Action(BLOCK), url);
          assert.equal(await new Promise(resolve => getBadgeText({tabId}, resolve)), '1');
        })
        it('removes actions', async function() {
          this.tab.markAction(new Action(BLOCK), url);
          this.tab.markAction(new Action(REMOVE_ACTION), url);
          assert.equal(await new Promise(resolve => getBadgeText({tabId}, resolve)), '');
        });
      });
      it('#markHeaders', function() {
        let removed = [cookie, cookie];
        this.tab.markHeaders(removed);
        assert.deepEqual(Array.from(this.tab.headerCounts), [['cookie', 2]]);
      });
    })
  });
});
