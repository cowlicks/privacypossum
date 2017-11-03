'use strict';

const assert = require('chai').assert,
  {WebRequest} = require('../webrequest'),
  {Tabs} = require('../tabs'),
  {DomainTree} = require('../store'),
  {details} = require('./testing_utils');


describe('webrequest.js', function() {
  describe('WebRequest', function() {
    describe('#onBeforeRequest', function() {
      it('adds frames', function() {
        let tabs = new Tabs(),
          wr = new WebRequest(tabs, new DomainTree());

        wr.onBeforeRequest(details.main_frame);
        assert.equal(
          tabs.getTabUrl(details.main_frame.tabId),
          details.main_frame.url
        );

        wr.onBeforeRequest(details.sub_frame);
        assert.equal(
          tabs.getFrameUrl(details.sub_frame.tabId, details.sub_frame.frameId),
          details.sub_frame.url
        );
      });
    });
  });
});
