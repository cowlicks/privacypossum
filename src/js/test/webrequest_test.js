import chai from 'chai'; const {assert} = chai;
import {WebRequest} from '../webrequest.js';
import {NO_ACTION} from '../constants.js';
import {Tabs} from '../tabs.js';
import {Store} from '../store.js';
import {details, clone, cookie, notCookie} from './testing_utils.js';


describe('webrequest.js', function() {
  beforeEach(function() {
    this.tabs = new Tabs(),
    this.wr = new WebRequest(this.tabs, new Store());
  });
  describe('WebRequest', function() {
    describe('#isThirdParty', function() {
      beforeEach(function() {
        let tabId = -1, initiator = 'https://firstparty.com', urlObj = {};
        this.details = {tabId, initiator, urlObj};
      });
      describe('tabId is -1', function() {
        it('thirdparty', function() {
          this.details.urlObj.hostname = 'thirdparty.com';
          assert.isTrue(this.wr.isThirdParty(this.details));
        });
        it('firstparty', function() {
          this.details.urlObj.hostname = 'firstparty.com';
          assert.isFalse(this.wr.isThirdParty(this.details));
        });
        it('thirdparty but no initiator', function() {
          this.details.urlObj.hostname = 'thirdparty.com';
          delete this.details.initiator;
          assert.isFalse(this.wr.isThirdParty(this.details));
        });
      });
    });
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
      this.main_frame = clone(details.main_frame);
      this.third_party = clone(details.third_party);
      this.third_party.url = 'https://third-party.com/';
    })
    it('removes cookies from thirdparty requests', function() {
      this.third_party.requestHeaders = [cookie, notCookie];
      assert.deepEqual(this.wr.onBeforeSendHeaders(this.third_party), {requestHeaders: [notCookie]});
    });
    it('does not effect first party cookies', function() {
      let first_party = clone(details.main_frame);
      first_party.requestHeaders = [cookie, notCookie];
      assert.deepEqual(this.wr.onBeforeSendHeaders(first_party), NO_ACTION);
    })
    it('does not effect thirdparty requests with no cookies', function() {
      this.third_party.requestHeaders = [notCookie, notCookie];
      assert.deepEqual(this.wr.onBeforeSendHeaders(this.third_party), {});
    });
  });

  // todo DRY with ohBeforeSendHeaders
  describe('#onHeadersReceived', function() {
    beforeEach(function() {
      this.wr.onBeforeRequest(details.main_frame);
      this.first_party = clone(details.main_frame);
      this.third_party = clone(details.third_party);
      this.third_party.url = 'https://third-party.com/';
    })
    it('does not effect cookies on main_frame requests', function() {
      this.first_party.responseHeaders = [cookie, notCookie];
      assert.deepEqual(this.wr.onHeadersReceived(this.first_party), NO_ACTION);
    });
    it('removes cookies from thirdparty requests', function() {
      this.third_party.responseHeaders = [cookie, notCookie];
      assert.deepEqual(this.wr.onHeadersReceived(this.third_party), {responseHeaders: [notCookie]});
    });
    it('does not effect first party cookies', function() {
      let first_party = clone(details.main_frame);
      first_party.responseHeaders = [cookie, notCookie];
      assert.deepEqual(this.wr.onHeadersReceived(first_party), {});
    })
    it('does not effect thirdparty requests with no cookies', function() {
      this.third_party.responseHeaders = [notCookie, notCookie];
      assert.deepEqual(this.wr.onHeadersReceived(this.third_party), {});
    });
  });

  describe('removeHeaders', function() {
    it('removes cookie headers', function() {
      let data = [
        [[], [], []],
        [[cookie, notCookie], [cookie], [notCookie]],
        [[notCookie, cookie, cookie, notCookie, cookie], [cookie, cookie, cookie], [notCookie, notCookie]],
      ];
      for (let [headers, expectedRemoved, expectedHeaders] of data) {
        let resRemoved = this.wr.removeHeaders({}, headers);
        assert.deepEqual(headers, expectedHeaders);
        assert.deepEqual(resRemoved, expectedRemoved);
      }
    });
  });
});
