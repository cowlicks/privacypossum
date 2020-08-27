import chai from 'chai'; const {assert} = chai;
import {Referer} from '../../reasons/referer.js';

describe('referer.js', function() {
  let requestId = 1,
    url = 'https://whatever.com/nope';
  beforeEach(function() {
    this.details = {requestId, url};
    this.header = {name: 'Referer', value: 'https://foo.com/stuff'};
    this.referer = new Referer();
  });
  describe('#shouldRemoveHeader', function() {
    it('removes first', function() {
      assert.isTrue(this.referer.shouldRemoveHeader(this.details, this.header));
    });
    it('does not remove when failedAlready', function() {
      this.referer.badRedirects.set(requestId);
      assert.isFalse(this.referer.shouldRemoveHeader(this.details, this.header));
    });
  });

  describe('#onHeadersReceived', function() {
    it('no action for non-400 responses', function() {
      assert.isUndefined(this.referer.onHeadersReceived({statusCode: 200}));
    });
    describe('sent', function() {
      beforeEach(function() {
        this.referer.shouldRemoveHeader(this.details, this.header);
      });
      it('no actionn for already failed but 400 again responses', function() {
        this.referer.badRedirects.set(requestId);
        assert.isUndefined(this.referer.onHeadersReceived({requestId, statusCode: 403}));
      });
      it('redirects on first 400', function() {
        let {details} = this,
          statusCode = 403;
        Object.assign(details, {statusCode});
        assert.deepEqual(this.referer.onHeadersReceived(details), {redirectUrl: details.url});
      });
    });
  });
});
