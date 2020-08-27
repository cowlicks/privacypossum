// todo messages.js was added reasons/handlers.js, so rename this file, or add it to handlers.js

import chai from 'chai'; const {assert} = chai;
import * as constants from '../constants.js';
import {shim} from '../shim.js';
const {URL, onMessage, sendMessage} = shim;
import {Tabs} from '../tabs.js';
import {Store} from '../store.js';
import {Action} from '../schemes.js';
import {MessageHandler} from '../reasons/handlers.js';
import {Mock, Details, details} from './testing_utils.js';

describe('messages.js', function() {
  describe('MessageHandler', function() {
    beforeEach(function() {
      this.tabs = new Tabs();
      this.store = new Store('name');
      this.ml = new MessageHandler(
        this.tabs,
        this.store,
      );
    });

    describe('#onMessage', function() {
      it('dispatches messages', function() {
        let func = new Mock(),
          type = 'test msg';

        this.ml.startListeners(onMessage);
        this.ml.addListener(type, func);

        sendMessage({type});
        assert.isTrue(func.called);
      })
    })

    describe('Deactivate', function() {
      let {main_frame} = details,
        {url, tabId} = main_frame,
        urlAction = new Action(constants.USER_URL_DEACTIVATE, {href: url}),
        hostAction = new Action(constants.USER_HOST_DEACTIVATE, {href: url});
      beforeEach(function() {
        this.tabs.addResource(main_frame);
      });

      it('url deactivate updates storage', async function() {
        let beforeAction = new Action('before');
        await this.ml.store.setUrl(url, beforeAction);

        await this.ml.dispatcher( // deactivate initial action
          {type: constants.USER_URL_DEACTIVATE, url, tabId},
          undefined
        );

        let action1 = this.ml.store.getUrl(url);
        assert.equal(action1.reason, urlAction.reason);
        assert.include(action1.data, urlAction.data);
        assert.deepEqual(action1.data.deactivatedAction, beforeAction);

        await this.ml.dispatcher( // reactivate initial action
          {type: constants.USER_URL_DEACTIVATE, url, tabId},
          undefined
        );

        let action2 = this.ml.store.getUrl(url);
        assert.deepEqual(action2, beforeAction);
      });


      it('host deactivate updates storage', async function() {
        await this.ml.dispatcher(
          {type: constants.USER_HOST_DEACTIVATE, tabId},
          undefined
        );
        let domain = this.ml.store.getDomain(url);
        assert.deepEqual(domain.action, hostAction);
      });
    });

    describe('#onFingerPrinting', function() {
      let url = new URL(details.script.url),
        message = {type: constants.FINGERPRINTING, url: url.href},
        action = new Action(
          constants.FINGERPRINTING,
          {
            href: url.href,
            frameUrl: undefined,
            tabUrl: undefined,
          }
        );

      beforeEach(async function() {
        this.ml.tabs.addResource(details.script); // add the resource
        await this.ml.dispatcher(message, details.script.toSender());
      });

      it('updates storage', async function() {
        let domain = await this.ml.store.getDomain(url.href);
        assert.isTrue(domain.paths.hasOwnProperty(url.pathname), 'path set on domain');

        let path = domain.paths[url.pathname];

        assert.deepEqual(path.action, action, 'correct action set');
      })

      it('adds a second path', async function() {
        let url2 = new URL(details.script.url);
        url2.pathname = '/otherpath.js';

        let details2 = new Details(Object.assign({}, details.script, {url: url2.href}))

        this.ml.tabs.addResource(details2); // add the resource
        await this.ml.dispatcher({type: constants.FINGERPRINTING, url: details2.url}, details2.toSender());

        let domain = await this.ml.store.getDomain(url2.href);
        assert.isTrue(domain.paths.hasOwnProperty(url2.pathname), 'path set on domain');

        let path = domain.paths[url2.pathname],
          action2 = new Action(action.reason, Object.assign({}, action.data, {href: url2.href}));

        assert.deepEqual(path.action, action2, 'correct action set');
      });

      it('rejects unknown resources', async function() {
        let details2 = new Details(Object.assign({}, details.script, {url: 'https://other.com/foo.js'}));
        await this.ml.dispatcher({type: constants.FINGERPRINTING, url: details2.url}, details2.toSender());
        assert.isUndefined(await this.ml.store.getDomain(details2.url), 'no domain gets set');
      });
    });
  });
});
