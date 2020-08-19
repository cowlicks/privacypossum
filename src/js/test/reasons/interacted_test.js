"use strict";

const {assert} = require('chai'),
  {Tabs} = require('../../tabs'),
  {InteractionWhitelist, wrapTabs} = require('../../reasons/interacted');

describe('interacted.js', function() {
  describe('InteractionWhitelist', function() {
    const [tabCacheSize, hostnameCacheSize] = [2, 2];
    beforeEach(function() {
      this.iw = new InteractionWhitelist({tabCacheSize, hostnameCacheSize});
    });
    it('adds', function() {
      const [tabId, hostname] = [1, 'zombo.com'];
      this.iw.update(tabId, hostname);
      assert.isTrue(this.iw.has(tabId, hostname));
      assert.isFalse(this.iw.has(tabId, 'what.cd'));
      assert.isFalse(this.iw.has(3, hostname));
      assert.isFalse(this.iw.has(3, 'dogpile.net'));
    });
    describe('caching', function() {
      beforeEach(function() {
        // fill caches
        this.iw.update(1, 'a').update(1, 'b').update(2, 'c').update(2, 'd');
      });
      it('tab cache clears lru', function() {
        this.iw.has(1, undefined); // touch tab 1, to make tab 2 lru
        this.iw.update(3, 'e');
        assert.isTrue(this.iw.has(1, 'a'));
        assert.isTrue(this.iw.has(1, 'b'));
        assert.isFalse(this.iw.has(2, 'c'));
        assert.isFalse(this.iw.has(2, 'd'));
        assert.isTrue(this.iw.has(3, 'e'));
      });
      it('host cache clears fifo', function() {
        this.iw.update(1, 'f') // pushes out hostname 'a'
        assert.isFalse(this.iw.has(1, 'a'));
        assert.isTrue(this.iw.has(1, 'b'));
        assert.isTrue(this.iw.has(1, 'f'));
      });
    });
  });
  describe('wrapTabs', function() {
    const tabId = 1, hostname = 'zombo.com',
      details = {tabId, url: `https://${hostname}/`, frameId: 0, type: 'main_frame'};
    beforeEach(function() {
      this.tabs = new Tabs();
      this.tabs.addResource(details);
      wrapTabs(this.tabs);
    });
    it('wraps', function() {
      assert.ok(this.tabs.interactionWhiteList);
    });
    it('whitelists effect isThirdParty', function() {
      assert.isTrue(this.tabs.isThirdParty(tabId, 'bar.com'));
      this.tabs.interactionWhiteList.update(tabId, 'bar.com');
      assert.isFalse(this.tabs.isThirdParty(tabId, 'bar.com'));
    });
  });
});
