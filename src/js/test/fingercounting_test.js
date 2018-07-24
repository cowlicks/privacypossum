'use strict';

const assert = require('chai').assert,
  {makeFingerCounting} = require('../web_accessible/fingercounting'),
  {Counter, getUrlFromStackLine} = makeFingerCounting(0, false),
  {makeTrap} = require('../utils'),
  {Mock} = require('./testing_utils');

describe('fingercounting.js', function() {
  describe('getUrlFromStackLine', function() {
    let data = [
      // test with both http & https urls
      [// basic
        '     at https://assets-cdn.github.com/assets/frameworks-3907d9aad812b8c94147c88165cb4a9693c57cf99f0e8e01053fc79de7a9d911.js:1:21747',
        'https://assets-cdn.github.com/assets/frameworks-3907d9aad812b8c94147c88165cb4a9693c57cf99f0e8e01053fc79de7a9d911.js',
      ],
      [
        '    at Object._agent (https://assets-cdn.github.com/assets/github-c1b10da21f1932a4173fcfb60676e2ad32e515f7ae77563ddb658f04cd26368d.js:1:59207)',
        'https://assets-cdn.github.com/assets/github-c1b10da21f1932a4173fcfb60676e2ad32e515f7ae77563ddb658f04cd26368d.js',
      ],
      [
        '    at e.getItem (https://assets-cdn.github.com/assets/frameworks-3907d9aad812b8c94147c88165cb4a9693c57cf99f0e8e01053fc79de7a9d911.js:1:235355)',
        'https://assets-cdn.github.com/assets/frameworks-3907d9aad812b8c94147c88165cb4a9693c57cf99f0e8e01053fc79de7a9d911.js',
      ],
      [// wtf is this?
        '    at new oj (http://og/initial.js:251:111)',
        'http://og/initial.js',
      ],
      [// evals
        '    at eval (/_/scs/mail-static/_/js/k=gmail.main.en.1QCYKmIiAi4.O/m=syft,syfv,synj,synm,syfu,synk,synn,syil,ld,syia,synl,sygd,cs,synr,syns,synt,synu,upc/am=_5zAHpDrBwJwGQMMojSDMPs_H7k0ePbG_v8_AAQqAHwD_s19AD0OAAAAAAAAAAAAAAAAAAAAtKP4BA/rt=j/d=0/rs=AHGWq9DaRVMOReCz9YPQye6TYr2Er4eGew:78:12)',
        '/_/scs/mail-static/_/js/k=gmail.main.en.1QCYKmIiAi4.O/m=syft,syfv,synj,synm,syfu,synk,synn,syil,ld,syia,synl,sygd,cs,synr,syns,synt,synu,upc/am=_5zAHpDrBwJwGQMMojSDMPs_H7k0ePbG_v8_AAQqAHwD_s19AD0OAAAAAAAAAAAAAAAAAAAAtKP4BA/rt=j/d=0/rs=AHGWq9DaRVMOReCz9YPQye6TYr2Er4eGew'
      ],
      [// nested evals
        '    at eval (eval at <anonymous> (eval at <anonymous> (https://www.google.com/js/bg/bs2Z69swfC90VjZ4cQvBgOmxp93Gw7ZcJUk83CeqMy0.js:1:90)), <anonymous>:1:68)',
        'https://www.google.com/js/bg/bs2Z69swfC90VjZ4cQvBgOmxp93Gw7ZcJUk83CeqMy0.js',
      ],
      [// at functionName [as methodName] (location)
        '    at _.Dg.xg [as constructor] (http://og/initial.js:116:154)',
        'http://og/initial.js',
      ],
      [// at clause has parenthese and location does too
        '    at Array.F.k.(anonymous function) [as user.agent] (https://docs.google.com/spreadsheets/d/1QJetruKfHrO5bpaLDk_smXYpLSvGlzytda_6koMjlCc/edit:642:1484)',
        'https://docs.google.com/spreadsheets/d/1QJetruKfHrO5bpaLDk_smXYpLSvGlzytda_6koMjlCc/edit',
      ],
      [// firefox
        '@https://cdn.sstatic.net/Js/stub.en.js?v=319f8d18e447:1:223',
        'https://cdn.sstatic.net/Js/stub.en.js',
      ],
      [// firefox
        'userAgentKey@http://valve.github.io/fingerprintjs2/fingerprint2.js:104:46',
        'http://valve.github.io/fingerprintjs2/fingerprint2.js'
      ],
      [
        '@https://duckduckgo.com/d2395.js:1:144567',
        'https://duckduckgo.com/d2395.js',
      ],
      [
        "    at https://online.citi.com/CBOL/common/js/jfp.combined.min.js:68:4324",
        "https://online.citi.com/CBOL/common/js/jfp.combined.min.js",
      ],
    ];
    it('extracts urls correctly', function() {
      data.forEach(([line, expected]) => assert.equal(getUrlFromStackLine(line), expected));
    });
  });

  describe('Counter', function() {
    let scriptLocation = 'some_location.js';
    beforeEach(function() {
      Object.assign(global, {testProp: {stuff: [1, 2, 3]}});
      this.config = {
          document: makeTrap(),
          globalObj: global,
          methods: [
            ['testProp.stuff', () => 'lie func called'],
            ['testProp.bar', () => 44],
            ['testProp.whatever', () => 'yep'],
          ],
          getScriptLocation: new Mock(scriptLocation),
          threshold: 0.5,
          send: new Mock(),
          listen: new Mock(),
        };
      this.counter = new Counter(this.config);
    });
    afterEach(function() {
      delete global['testProp'];
    });
    it('#constructor', function() {
      const {counter} = this;

      assert.deepEqual(counter.send.calledWith, [{type: 'ready'}]);
      assert.isTrue(counter.listen.called);

      testProp.stuff; // eslint-disable-line
      assert.isFalse(counter.locations[scriptLocation].isFingerprinting);

      testProp.bar; // eslint-disable-line
      assert.isTrue(counter.locations[scriptLocation].isFingerprinting);

      assert.deepEqual(counter.send.calledWith, [{type: 'fingerprinting', url: scriptLocation}]);
      assert.equal(counter.getScriptLocation.ncalls, 2);
      assert.equal(testProp.stuff, 'lie func called'); // eslint-disable-line
    });
    it('watches funcs', function() {
      const {counter} = this;

      testProp.stuff; // eslint-disable-line
      assert.equal(counter.locations[scriptLocation].counts['testProp.stuff'], 1);
      testProp.stuff; // eslint-disable-line
      assert.equal(counter.locations[scriptLocation].counts['testProp.stuff'], 2);
    });
    it('you can overwrite stuff and it is still watched', function() {
      const {counter} = this;

      testProp['stuff'] = 'hi!';
      assert.equal(testProp.stuff, 'hi!');
      assert.equal(counter.locations[scriptLocation].counts['testProp.stuff'], 1);
      testProp.stuff;
      assert.equal(counter.locations[scriptLocation].counts['testProp.stuff'], 2);
    });
  });
});
