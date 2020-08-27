import chai from 'chai'; const {assert} = chai;
import {isThirdParty} from '../domains/parties.js';

describe('parties.js', function() {
  it('false cases', function() {
    assert.isFalse(isThirdParty('reddit.com', 'redditstatic.com'));
    assert.isFalse(isThirdParty('github.com', 'avatars2.githubusercontent.com'));
  });
});
