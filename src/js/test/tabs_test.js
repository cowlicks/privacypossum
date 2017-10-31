'use strict';

const assert = require('chai').assert,
  {Tabs, Frame} = require('../tabs');

const main_frame_details = {frameId: 0, url: 'https://google.com/', tabId: 1, parentFrameId: -1},
  sub_frame_details = {frameId: 1, url: 'about:blank', tabId: 1, parentFrameId: 0};

describe('tabs.js', function() {
  let main_frame = new Frame(main_frame_details),
    sub_frame = new Frame(sub_frame_details);

  describe('Tabs', function() {
    beforeEach(function() {
      this.tabs = new Tabs();
      this.tabs.addFrame(main_frame);
      this.tabs.addFrame(sub_frame);
    });

    it('#getTabUrl', function() {
      assert.equal(this.tabs.getTabUrl(1), 'https://google.com/');
      assert.isUndefined(this.tabs.getTabUrl('not present'));
    });

    it('#getFrameUrl', function() {
      assert.equal(this.tabs.getFrameUrl(1, 1), 'about:blank');
    });

    it('#removeTab', function() {
      this.tabs.addFrame(main_frame);
      assert.isTrue(this.tabs.removeTab(main_frame.tabId));
    });
  });
});
