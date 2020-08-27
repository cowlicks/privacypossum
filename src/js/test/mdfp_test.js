import chai from 'chai'; const {assert} = chai;
import {isMdfp} from '../domains/mdfp.js';

describe('mdfp.js', function() {
  it('true cases', function() {
    assert.isTrue(isMdfp('reddit.com', 'redditstatic.com'));
    assert.isTrue(isMdfp('reddit.com', 'reddit.com'));
    assert.isTrue(isMdfp('notonlist.com', 'notonlist.com'));
    assert.isTrue(isMdfp('avatars0.githubusercontent.com', 'github.com'));
  })

  it('false cases', function() {
    assert.isFalse(isMdfp('reddit.com', 'railnation.de'));
    assert.isFalse(isMdfp('notonlist.com', 'othernotonlist.com'));
  });
});
