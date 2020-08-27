import chai from 'chai'; const {assert} = chai;
import {Store} from '../../store.js';
import {newEtagHeaderFunc, setEtagAction} from '../../reasons/etag.js';
import {etag} from '../../constants.js';
const {ETAG_TRACKING} = etag;

describe('etag.js', function() {
  let etagValue ='hi', href = 'https://foo.com/stuff.js';
  beforeEach(function() {
    this.store = new Store('name');
    this.etagHeader = newEtagHeaderFunc(this.store);
    this.header = {name: 'etag', value: etagValue};
    this.details = {urlObj: {href}};

  });
  describe('etagHeader', function() {
    it('marks new etag headers as uknown', async function() {
      let {details, header} = this,
        remove = this.etagHeader(details, header),
        action = this.store.getUrl(details.urlObj.href);
      assert.isTrue(remove);
      assert.isUndefined(action);
    });
    it('allows and marks as safe on same etag', async function() {
      let {details, header} = this;

      this.etagHeader(details, header);
      assert.isFalse(this.etagHeader(details, header));
    })
    it('blocks and marks as tracking on diff etag', async function() {
      let {details, header} = this,
        differentEtagValue = 'different';

      this.etagHeader(details, header);
      let remove = this.etagHeader(details, {value: differentEtagValue});
      assert.isTrue(remove);
      assert.equal(details.action.reason, ETAG_TRACKING);

      let action = this.store.getUrl(details.urlObj.href);
      assert.equal(action.reason, ETAG_TRACKING);
      assert.equal(action.data.etagValue, differentEtagValue);
    })
    it('blocks etags from tracking urls', async function() {
      let {details, header} = this;

      await setEtagAction(this.store, href, ETAG_TRACKING);
      let remove = this.etagHeader(details, header);

      assert.equal(details.action.reason, ETAG_TRACKING);
      assert.isTrue(remove);
    })
  });
});
