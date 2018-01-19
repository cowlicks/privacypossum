'use strict';

const assert = require('chai').assert,
  {Domain, Action} = require('../schemes'),
  constants = require('../constants');


function makeAction(reason, url, frameUrl, tabUrl) {
  return new Action({reason, url, frameUrl, tabUrl});
}

describe('schemes.js', function() {
  describe('Domain', function() {
    describe('#getResponse', function() {
      it('gets and sets paths', function() {
        let [k1, k2] = ['path1', 'path2'],
          [v1, v2] = ['value1', 'value2'],
          d = new Domain({paths: {[k1]: v1}});

        assert.deepEqual(d.getPath(k1), v1);

        d.setPath(k2, v2);
        assert.deepEqual(d.getPath(k2), v2);
      });
    });
  });
});
