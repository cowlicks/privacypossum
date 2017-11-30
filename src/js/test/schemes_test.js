'use strict';

const assert = require('chai').assert,
  {Domain, Path, Action} = require('../schemes'),
  constants = require('../constants');


function makeAction(reason, url, frameUrl, tabUrl) {
  return new Action({reason, url, frameUrl, tabUrl});
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
          p1 = new Path(constants.CANCEL, makeAction(...('abcd'.split('')))),
          p2 = new Path(constants.CANCEL, makeAction(...('efgh'.split('')))),
          d = new Domain({paths: {[k1]: p1}});

        assert.equal(d.getResponse(k1), p1.action);

        d.setPath(k2, p2.action, p2.context);
        assert.equal(d.getResponse(k2), p2.action);
      });
    });
  });
});
