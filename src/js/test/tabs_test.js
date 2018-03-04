'use strict';

let assert = require('chai').assert,
  {BLOCK, REMOVE_ACTION} = require('../constants'),
  {onRemoved, getBadgeText} = require('../shim'),
  {Action} = require('../schemes'),
  {cookie} = require('./testing_utils'),
  {Tab, Tabs} = require('../tabs');

const tabId = 1,
  main_frame = {frameId: 0, url: 'https://google.com/', tabId, parentFrameId: -1, type: 'main_frame'},
  sub_frame = {frameId: 1, url: 'about:blank', tabId, parentFrameId: 0, type: 'sub_frame'};

describe('tabs.js', function() {
  describe('Tabs', function() {
    beforeEach(function() {
      this.tabs = new Tabs();
      this.tabs.addResource(main_frame);
      this.tabs.addResource(sub_frame);
      this.tab = this.tabs.getTab(main_frame.tabId);
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

    describe('#startListeners', function() {
      it('removes tabs on message', async function() {
        this.tabs.startListeners({onRemoved});
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
