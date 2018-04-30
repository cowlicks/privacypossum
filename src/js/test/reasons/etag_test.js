"use strict";

const {assert} = require('chai'),
  {DomainStore} = require('../../store'),
  {etagHeader} = require('../../reasons/etag'),
  {etag: {ETAG_TRACKING, ETAG_SAFE, ETAG_UNKNOWN}} = require('../../constants');

describe('etag.js', function() {
  beforeEach(function() {
    this.store = new DomainStore('name');
    this.etagHeader = etagHeader.bind(this, this);
  });
  describe('etagHeader', function() {
    it('marks new etag headers as uknown', async function() {
      let details = {urlObj: {href: 'https://foo.com/stuff.js'}},
        header = {name: 'etag', value: 'hi'};

      let [removed, done] = this.etagHeader(details, header);
      await done;
      let action = this.store.getUrl(details.urlObj.href);
      assert.isTrue(removed);
      assert.equal(action.reason, ETAG_UNKNOWN);
      assert.equal(action.data.etagValue, header.value);
    });
  });
});
