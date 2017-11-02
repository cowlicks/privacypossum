'use strict';

const assert = require('chai').assert,
  {WebRequest} = require('../webrequest'),
  {Tabs} = require('../tabs'),
  {setupDomainTree} = require('./testing_utils');


const main_details = {frameId: 0, url: 'https://google.com/', tabId: 1, parentFrameId: -1, type: 'main_frame'},
  sub_details = {frameId: 1, url: 'about:blank', tabId: 1, parentFrameId: 0, type: 'sub_frame'};

describe('webrequest.js', function() {
  describe('WebRequest', function() {
    describe('#onBeforeRequest', function() {
      it('adds frames', function() {
        let tabs = new Tabs(),
          wr = new WebRequest(tabs, setupDomainTree());

        wr.onBeforeRequest(main_details);
        assert.equal(tabs.getTabUrl(main_details.tabId), main_details.url);

        wr.onBeforeRequest(sub_details);
        assert.equal(tabs.getFrameUrl(sub_details.tabId, sub_details.frameId), sub_details.url);
      });
    });
  });
});
