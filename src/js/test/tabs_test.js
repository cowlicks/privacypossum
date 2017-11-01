'use strict';

const assert = require('chai').assert,
  {Tabs, Frame} = require('../tabs');

const main_frame_details = {frameId: 0, url: 'https://google.com/', tabId: 1, parentFrameId: -1, type: 'main_frame'},
  sub_frame_details = {frameId: 1, url: 'about:blank', tabId: 1, parentFrameId: 0, type: 'sub_frame'};

describe('tabs.js', function() {
  describe('Tabs', function() {
    beforeEach(function() {
      this.tabs = new Tabs();
      this.tabs.addResource(main_frame_details);
      this.tabs.addResource(sub_frame_details);
    });

    it('#getTabUrl', function() {
      assert.equal(this.tabs.getTabUrl(1), 'https://google.com/');
      assert.isUndefined(this.tabs.getTabUrl('not present'));
    });

    it('#getFrameUrl', function() {
      assert.equal(this.tabs.getFrameUrl(1, 1), 'about:blank');
    });

    it('#removeTab', function() {
      this.tabs.addResource(main_frame_details);
      assert.isTrue(this.tabs.removeTab(main_frame_details.tabId));
    });
  });
});
