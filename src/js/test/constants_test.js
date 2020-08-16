import chai from 'chai'; const {assert} = chai;

import * as constants from '../constants.js';

describe('constants.js', () => {
  it('has constants attached', () => {
    assert.equal([...Object.keys(constants)].length > 0, true);
  });
});
