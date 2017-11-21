'use strict';

const assert = require('chai').assert,
  {Domain, Path, Context} = require('../schemes'),
  constants = require('../constants');


function makeContext(reason, url, frameUrl, tabUrl) {
  return new Context({reason, url, frameUrl, tabUrl});
}

describe('schemes.js', function() {
  describe('Domain', function() {
    describe('#getAction', function() {
      it('returns NO_ACTION', function() {
        let d = new Domain();
        assert.equal(d.getAction('foo'), constants.NO_ACTION);
      });
      it('gets added Actions', function() {
        let [k1, k2] = ['path1', 'path2'],
          p1 = new Path(constants.CANCEL, new makeContext(...('abcd'.split('')))),
          p2 = new Path(constants.CANCEL, new makeContext(...('efgh'.split('')))),
          d = new Domain({paths: {[k1]: p1}});

        assert.equal(d.getAction(k1), p1.action);

        d.setPath(k2, p2.action, p2.context);
        assert.equal(d.getAction(k2), p2.action);
      });
    });
  });
});
