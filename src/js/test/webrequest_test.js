'use strict';

const assert = require('chai').assert,
  {WebRequest, removeCookies} = require('../webrequest'),
  {Tabs} = require('../tabs'),
  {DomainStore} = require('../store'),
  {details, clone} = require('./testing_utils');

let notCookie = {name: 'a', value: 'b'},
  cookie = {name: 'Cookie', value: 'c'};


describe('webrequest.js', function() {
  beforeEach(function() {
    this.tabs = new Tabs(),
    this.wr = new WebRequest(this.tabs, new DomainStore());

  });
  describe('WebRequest', function() {
    describe('#onBeforeRequest', function() {
      it('adds frames', function() {
        this.wr.onBeforeRequest(details.main_frame);
        assert.equal(
          this.tabs.getTabUrl(details.main_frame.tabId),
          details.main_frame.url
        );

        this.wr.onBeforeRequest(details.sub_frame);
        assert.equal(
          this.tabs.getFrameUrl(details.sub_frame.tabId, details.sub_frame.frameId),
          details.sub_frame.url
        );
      });
    });
  });

  describe('#onBeforeSendHeaders', function() {
    beforeEach(function() {
      this.wr.onBeforeRequest(details.main_frame);
      this.third_party = clone(details.main_frame);
      this.third_party.url = 'https://third-party.com/';
    })
    it('removes cookies from thirdparty requests', function() {
      this.third_party.requestHeaders = [cookie, notCookie];
      assert.deepEqual(this.wr.onBeforeSendHeaders(this.third_party), {requestHeaders: [notCookie]});
    });
    it('does not effect first party cookies', function() {
      let first_party = clone(details.main_frame);
      first_party.requestHeaders = [cookie, notCookie];
      assert.deepEqual(this.wr.onBeforeSendHeaders(first_party), {});
    })
    it('does not effect thirdparty requests with no cookies', function() {
      this.third_party.requestHeaders = [notCookie, notCookie];
      assert.deepEqual(this.wr.onBeforeSendHeaders(this.third_party), {});
    });
  });

  describe('removeCookies', function() {
    it('removes cookies', function() {
      let one = [],
        two = [cookie, notCookie],
        three = [notCookie, cookie, cookie, notCookie, cookie];

      assert.isFalse(removeCookies(one));
      assert.deepEqual(one, []);

      assert.isTrue(removeCookies(two));
      assert.deepEqual(two, [notCookie]);

      assert.isTrue(removeCookies(three));
      assert.deepEqual(three, [notCookie, notCookie]);
    });
  });
});
