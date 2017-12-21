'use strict';

const assert = require('chai').assert,
  {Counter} = require('../web_accessible/fingercounting'),
  {makeTrap} = require('../utils'),
  {Mock} = require('./testing_utils');

describe('fingercounting.js', function() {
  describe('Counter', function() {
    beforeEach(function() {
      Object.assign(global, {testProp: {stuff: [1, 2, 3]}});
    });
    afterEach(function() {
      delete global['testProp'];
    });
    it('#constructor', function() {
      let scriptLocation = 'some_location.js',
        config = {
          document: makeTrap(),
          globalObj: global,
          methods: ['testProp.stuff'],
          getScriptLocation: new Mock(scriptLocation),
          onFingerPrinting: new Mock(),
          threshold: 0.75,
        };

      let counter = new Counter(config);
      try {
        testProp.stuff; // eslint-disable-line
      } catch (e) {
        assert.isTrue(e.message.startsWith('Fingerprinting'));
      }

      assert.isTrue(counter.locations[scriptLocation].isFingerprinting);
      assert.deepEqual(counter.onFingerPrinting.calledWith, [scriptLocation]);
      assert.equal(counter.getScriptLocation.ncalls, 1);
    });
  });
});
