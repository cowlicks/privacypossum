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
      it('returns NO_ACTION', function() {
        let d = new Domain();
        assert.equal(d.getResponse('foo'), constants.NO_ACTION);
      });
      it('gets added Actions', function() {
        let [k1, k2] = ['path1', 'path2'],
          p1 = new Path(constants.CANCEL, makeAction(...('abcde'.split('')))),
          p2 = new Path(constants.CANCEL, makeAction(...('fghij'.split('')))),
          d = new Domain({paths: {[k1]: p1}});

        assert.equal(d.getResponse(k1), p1.action.response);

        d.setPath(k2, p2.action);
        assert.equal(d.getResponse(k2), p2.action.response);
      });
    });
  });
});
