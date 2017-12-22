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
          methods: [['testProp.stuff', () => 'lie func called']],
          getScriptLocation: new Mock(scriptLocation),
          threshold: 0.75,
          send: new Mock(),
          listen: new Mock(),
        };

      let counter = new Counter(config);
      assert.deepEqual(counter.send.calledWith, [{type: 'ready'}]);
      assert.isTrue(counter.listen.called);

      testProp.stuff; // eslint-disable-line

      assert.isTrue(counter.locations[scriptLocation].isFingerprinting);
      assert.deepEqual(counter.send.calledWith, [{type: 'fingerprinting', url: scriptLocation}]);
      assert.equal(counter.getScriptLocation.ncalls, 1);
      assert.equal(testProp.stuff, 'lie func called');
    });
  });
});
