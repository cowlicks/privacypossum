'use strict';

const assert = require('chai').assert,
  {Counter, getUrlFromStackLine} = require('../web_accessible/fingercounting'),
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
    ];
    it('extracts urls correctly', function() {
      data.forEach(([line, expected]) => assert.equal(getUrlFromStackLine(line), expected));
    });
  });

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
      assert.equal(testProp.stuff, 'lie func called'); // eslint-disable-line
    });
  });
});
