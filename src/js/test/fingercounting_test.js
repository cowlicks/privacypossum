import chai from 'chai'; const {assert} = chai;
import {makeTrap} from '../utils.js';
import {Mock} from './testing_utils.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {makeFingerCounting} = require('../contentscripts/fingercounting.cjs');

const {Counter, getUrlFromStackLine} = makeFingerCounting(0, false);

describe('fingercounting.cjs', function() {
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
    const init = 'startsWith', changed = 'more data', location = 'some_location.js',
      getCounts = (counter, prop) => counter.locations[location].counts[prop],
      getName = (obj, name) => name.split('.').reduce((o, i) => o[i], obj),
      setName = (obj, name, value) => {
        let arr = name.split('.'),
          last = arr.pop();
        return getName(obj, arr.join('.'))[last] = value;
      }

    beforeEach(function() {
      this.config = {
        document: makeTrap(),
        getScriptLocation: new Mock(location),
        send: new Mock(),
        listen: new Mock(),
        threshold: null, // set me
        globalObj: null, // set me
        methods: [], // fill me
      };
    });
    afterEach(function() {
      delete this['testProp'];
    });
    describe('wrapCall', function() {
      beforeEach(function() {
        this.Foo = class {
          get noSetter(){
            return init;
          }
          get accessor() {
              if (!this.value) {
                this.value = init;
              }
              return this.value;
            }
          set accessor(x) {
            return this.value = x;
          }
          data() {return init}
        }
        let {get, set} = Object.getOwnPropertyDescriptor(this.Foo.prototype, 'accessor')
        this.testProp = {foo: new this.Foo(), otherFoo: new this.Foo(), data: init};
        Object.defineProperties(this.testProp, {
          accessor: {get, set, configurable: true},
          noSetter: {get, set, configurable: true},
        });
        Object.assign(this.config, {threshold: 2, globalObj: this});
      });

      // test helpers
      let setUp = (obj, name) => {
        obj.config.methods.push([name, () =>{}]);
        return [name, new Counter(obj.config)];
      };
      let assertGetsButNoSet = (obj, counter, name) => {
        assert.equal(getName(obj, name), init);
        assert.equal(getCounts(counter, name), 1);
        setName(obj, name, false);
        assert.equal(getName(obj, name), init);
        assert.equal(getCounts(counter, name), 2);
      };
      let assertGetsAndSets = (obj, counter, name) => {
        assert.equal(getName(obj, name), init);
        assert.equal(getCounts(counter, name), 1);
        assert.equal(setName(obj, name, changed), changed);
        assert.equal(getName(obj, name), changed);
        assert.equal(getCounts(counter, name), 2);
      }

      it('prop on proto, accessor, no setter', function() {
        let [name, counter] = setUp(this, 'testProp.foo.noSetter');

        assertGetsButNoSet(this, counter, name);

        let foo2 = new this.Foo();
        assert.equal(foo2.noSetter, init, 'other instances unchanged');
        assert.equal(getCounts(counter, 'testProp.foo.noSetter'), 2);
      });
      it('prop on this, accessor, no setter', function() {
        let [name, counter] = setUp(this, 'testProp.noSetter');

        assertGetsButNoSet(this, counter, name);
      })

      it('prop on proto, accessor, with setter', function() {
        let [name, counter] = setUp(this, 'testProp.foo.accessor');

        assertGetsAndSets(this, counter, name);

        let otherFoo = new this.Foo();
        assert.equal(otherFoo.accessor, init, 'other instances unchanged');
      });
      it('prop on this, accessor, with setter', function() {
        let [name, counter] = setUp(this, 'Foo.prototype.accessor');

        assertGetsAndSets(this, counter, name);
      });

      it('wrap proto prop with accessor no setter', function() {
        let [wrappedName, counter] = setUp(this, 'Foo.prototype.noSetter'),
          name1 = 'testProp.foo.noSetter', name2 = 'testProp.otherFoo.noSetter';

        assert.equal(getName(this, name1), init);
        assert.equal(getName(this, name2), init);
        assert.equal(getCounts(counter, wrappedName), 2);
        assert.equal(setName(this, name1, changed), changed);
        assert.equal(getName(this, name1), init);
      });
      it('wrap proto prop with accessor with setter', function() {
        let [wrappedName, counter] = setUp(this, 'Foo.prototype.accessor'),
          name1 = 'testProp.foo.accessor', name2 = 'testProp.otherFoo.accessor';

        assert.equal(getName(this, name1), init);
        assert.equal(getName(this, name2), init);
        assert.equal(getCounts(counter, wrappedName), 2);
        assert.isFalse(this.testProp.foo.hasOwnProperty('accessor'), 'accessor is on proto');
        assert.equal(setName(this, name1, changed), changed);
        assert.equal(getName(this, name1), changed);
        assert.equal(getName(this, name2), init, 'other instances do not');
      });
      it('wrap data prop on proto', function() {
        let [wrappedName, counter] = setUp(this, 'Foo.prototype.data'),
          name1 = 'testProp.foo.data', name2 = 'testProp.otherFoo.data';

        let expected = getName(this, wrappedName);
        assert.equal(getName(this, name1), expected);
        assert.equal(getName(this, name2), expected);
        assert.equal(getCounts(counter, wrappedName), 3);
        assert.isFalse(this.testProp.foo.hasOwnProperty('data'), 'data is on proto');

        assert.equal(setName(this, name1, changed), changed);
        assert.equal(getName(this, name1), changed, 'assigned instance changes');
        assert.equal(getName(this, name2), expected, 'other instances do not');

        let expected2 = 42;
        assert.equal(setName(this, wrappedName, expected2), expected2); // change on the proto
        assert.equal(getName(this, name2), expected2, 'changing the prototype changes the instances');
        assert.equal(getName(this, name1), changed, 'but not not overwritten instances');
      });
      it('wrap data prop on this', function() {
        let [name, counter] = setUp(this, 'testProp.data');
        assertGetsAndSets(this, counter, name);
      });
    });
    it('#constructor', function() {
      this.testProp = {init};
      Object.assign(this.config, {globalObj: this, threshold: 0.5,
          methods: [
            ['testProp.init', () => changed],
            ['testProp.bar', () => 44],
            ['testProp.whatever', () => 'yep'],
          ],
      });
      const counter = new Counter(this.config);

      assert.deepEqual(counter.send.calledWith, [{type: 'ready'}]);
      assert.isTrue(counter.listen.called);

      this.testProp.init;
      assert.isFalse(counter.locations[location].isFingerprinting);

      this.testProp.bar;
      this.testProp.whatever;

      assert.isTrue(counter.locations[location].isFingerprinting);
      assert.deepEqual(counter.send.calledWith, [{type: 'fingerprinting', url: location}]);
      assert.equal(this.testProp.init, changed);
    });
  });
});
