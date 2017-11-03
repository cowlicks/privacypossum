"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {URL, onMessage, sendMessage} = require('../shim'),
  {Tabs} = require('../tabs'),
  {DomainTree} = require('../store'),
  {Context} = require('../schemes'),
  {MessageDispatcher} = require('../messages'),
  {Mock} = require('./testing_utils');

describe('messages.js', function() {
  describe('MessageDispatcher', function() {
    beforeEach(function() {
      this.ml = new MessageDispatcher(
        new Tabs(),
        new DomainTree('name'),
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
      let tabId = 1, frameId = 0, type = 'script',
        url = new URL('https://foo.bar/fingerprint.js'),
        resource = {tabId, frameId, url: url.href, type},
        message = {url: url.href},
        sender = {tab: {id: tabId}, frameId};

      it('updates storage', async function() {
        this.ml.tabs.addResource(resource); // add the resource
        await this.ml.onFingerPrinting(message, sender);

        let domain = await this.ml.store.getUrl(url.href);
        assert.isTrue(domain.paths.hasOwnProperty(url.pathname), 'path set on domain');

        let path = domain.paths[url.pathname];
        assert.deepEqual(path.action, constants.CANCEL, 'correct action is set');

        let ctx = new Context({
          reason: constants.FINGERPRINTING,
          url: url.href,
          frameUrl: undefined,
          tabUrl: undefined,
        });
        assert.deepEqual(path.context, ctx, 'correct context set');
      })

      it('rejects unknown resources', async function() {
        await this.ml.onFingerPrinting(message, sender);
        assert.isUndefined(await this.ml.store.getUrl(url.href), 'no domain gets set');
      });
    });
  });
});
