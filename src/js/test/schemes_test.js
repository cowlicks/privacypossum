'use strict';

const assert = require('chai').assert,
  {Domain, Path, Action} = require('../schemes'),
  constants = require('../constants');


function makeAction(response, reason, url, frameUrl, tabUrl) {
  return new Action({response, reason, url, frameUrl, tabUrl});
}

describe('schemes.js', function() {
  describe('Domain', function() {
    describe('#getResponse', function() {
      it('gets and sets paths', function() {
        let [k1, k2] = ['path1', 'path2'],
          p1 = new Path(constants.CANCEL, makeAction(...('abcde'.split('')))),
          p2 = new Path(constants.CANCEL, makeAction(...('fghij'.split('')))),
          d = new Domain({paths: {[k1]: p1}});

        assert.deepEqual(d.getPath(k1), p1);

        d.setPath(k2, p2.action);
        assert.deepEqual(d.getPath(k2), p2);
      });
    });
  });
});
