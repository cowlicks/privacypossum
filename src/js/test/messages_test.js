"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {URL, onMessage, sendMessage} = require('../shim'),
  {Tabs} = require('../tabs'),
  {DomainStore} = require('../store'),
  {Context} = require('../schemes'),
  {MessageDispatcher} = require('../messages'),
  {Mock, details} = require('./testing_utils');

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
        message = {url: url.href};

      it('updates storage', async function() {
        this.ml.tabs.addResource(details.script); // add the resource
        await this.ml.onFingerPrinting(message, details.script.toSender());

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
        await this.ml.onFingerPrinting(message, details.script.toSender());
        assert.isUndefined(await this.ml.store.getUrl(url.href), 'no domain gets set');
      });
    });
  });
});
