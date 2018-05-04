"use strict";

const {assert} = require('chai'),
  {DomainStore} = require('../../store'),
  {etagHeader, setEtagAction} = require('../../reasons/etag'),
  {LruMap} = require('../../utils'),
  {etag: {ETAG_TRACKING, ETAG_SAFE, ETAG_UNKNOWN}} = require('../../constants');

describe('etag.js', function() {
  beforeEach(function() {
    this.store = new DomainStore('name');
    this.cache = new LruMap();
    this.etagHeader = etagHeader.bind(this, this);
  });
  describe('etagHeader', function() {
    let etagValue ='hi', href = 'https://foo.com/stuff.js',
      details = {urlObj: {href}},
      header = {name: 'etag', value: etagValue};

    it('marks new etag headers as uknown', async function() {
      let remove = this.etagHeader(details, header);
      let action = this.store.getUrl(details.urlObj.href);
      assert.isTrue(remove);
      assert.isUndefined(action);
    });
    it('allows and marks as safe on same etag', async function() {
      this.etagHeader(details, header);
      let remove = this.etagHeader(details, header);
      assert.isFalse(remove);

      let action = this.store.getUrl(details.urlObj.href);
      assert.equal(action.reason, ETAG_SAFE);
      assert.equal(action.data.etagValue, header.value);
    })
    it('blocks and marks as tracking on diff etag', async function() {
      let differentEtagValue = 'different';
      this.etagHeader(details, header);
      let remove = this.etagHeader(details, {value: differentEtagValue});
      assert.isTrue(remove);

      let action = this.store.getUrl(details.urlObj.href);
      assert.equal(action.reason, ETAG_TRACKING);
      assert.equal(action.data.etagValue, differentEtagValue);
    })
    it('blocks etags from tracking urls', async function() {
      await setEtagAction(this.store, href, ETAG_TRACKING);
      let remove = this.etagHeader(details, header);
      assert.isTrue(remove);
    })
    it('allows etags from safe urls', async function() {
      await setEtagAction(this.store, href, ETAG_SAFE);
      let remove = this.etagHeader(details, header);
      assert.isFalse(remove);
    })
  });
});
