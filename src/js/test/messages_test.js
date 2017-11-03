"use strict";

const assert = require('chai').assert,
  constants = require('../constants'),
  {URL} = require('../shim'),
  {Tabs} = require('../tabs'),
  {DomainTree} = require('../store'),
  {Context} = require('../schemes'),
  {MessageListener} = require('../messages');

describe('messages.js', function() {
  describe('MessageListener', function() {
    beforeEach(function() {
      this.ml = new MessageListener(
        new Tabs(),
        new DomainTree('name'),
      );
    });
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
