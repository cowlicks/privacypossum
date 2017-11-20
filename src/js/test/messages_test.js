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
        details2 = new Details(Object.assign({}, details.script));

      details2.url = 'https://second.com/script.js';
      let url2 = new URL(details2.url),
        message2 = {url: url2.href};

      beforeEach(async function() {
        this.ml.tabs.addResource(details.script); // add the resource
        await this.ml.onFingerPrinting(message, details.script.toSender());
      });

      it('updates storage', async function() {
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
        await this.ml.onFingerPrinting(message2, details2.toSender());
        assert.isUndefined(await this.ml.store.getUrl(url2.href), 'no domain gets set');
      });
    });
  });
});
