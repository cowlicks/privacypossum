"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {URL, onMessage, sendMessage} = require('../shim'),
  {Tabs} = require('../tabs'),
  {DomainStore} = require('../store'),
  {Context} = require('../schemes'),
  {MessageDispatcher} = require('../messages'),
  {Mock, Details, details} = require('./testing_utils');

describe('messages.js', function() {
  describe('MessageDispatcher', function() {
    beforeEach(function() {
      this.ml = new MessageDispatcher(
        new Tabs(),
        new DomainStore('name'),
      );
    });

    describe('#onMessage', function() {
      it('dispatches messages', function() {
        let func = new Mock(),
          type = 'test msg';

        this.ml.start(onMessage);
        this.ml.addListener(type, func);

        sendMessage({type});
        assert.isTrue(func.called);
      })
    })
    describe('#onFingerPrinting', function() {
      let url = new URL(details.script.url),
        message = {url: url.href},
        ctx = new Context({
          reason: constants.FINGERPRINTING,
          url: url.href,
          frameUrl: undefined,
          tabUrl: undefined,
        });

      beforeEach(async function() {
        this.ml.tabs.addResource(details.script); // add the resource
        await this.ml.onFingerPrinting(message, details.script.toSender());
      });

      it('updates storage', async function() {
        let domain = await this.ml.store.getUrl(url.href);
        assert.isTrue(domain.paths.hasOwnProperty(url.pathname), 'path set on domain');

        let path = domain.paths[url.pathname];
        assert.deepEqual(path.action, constants.CANCEL, 'correct action is set');

        assert.deepEqual(path.context, ctx, 'correct context set');
      })

      it('adds a second path', async function() {
        let url2 = new URL(details.script.url);
        url2.pathname = '/otherpath.js';

        let details2 = new Details(Object.assign({}, details.script, {url: url2.href}))

        this.ml.tabs.addResource(details2); // add the resource
        await this.ml.onFingerPrinting({url: details2.url}, details2.toSender());

        let domain = await this.ml.store.getUrl(url2.href);
        assert.isTrue(domain.paths.hasOwnProperty(url2.pathname), 'path set on domain');

        let path = domain.paths[url2.pathname];
        assert.deepEqual(path.action, constants.CANCEL, 'correct action is set');

        let ctx2 = new Context(Object.assign({}, ctx, {url: url2.href}));

        assert.deepEqual(path.context, ctx2, 'correct context set');
      });

      it('rejects unknown resources', async function() {
        let details2 = new Details(Object.assign({}, details.script, {url: 'https://other.com/foo.js'}));
        await this.ml.onFingerPrinting({url: details2.url}, details2.toSender());
        assert.isUndefined(await this.ml.store.getUrl(details2.url), 'no domain gets set');
      });
    });
  });
});
