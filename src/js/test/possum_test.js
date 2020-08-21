import chai from 'chai'; const {assert} = chai;
import * as constants from '../constants.js';
import {Reason} from '../reasons/reasons.js';
import {Action} from '../schemes.js';
import {shim} from '../shim.js';
const {tabsOnMessage, sendMessage, URL, getBadgeText, tabsQuery} = shim;
import {clearState, setDocumentHtml, cookie, notCookie, details, Details, toSender, makePopup} from './testing_utils.js';
import {Popup, $} from '../popup.js';
import {Possum} from '../possum.js';

const {script, main_frame, first_party_script, third_party} = details,
  reqHeaders = new Details(Object.assign(script.copy(), {requestHeaders: [cookie, notCookie]})),
  respHeaders = new Details(Object.assign(script.copy(), {responseHeaders: [cookie, notCookie]}));

const {CANCEL, USER_URL_DEACTIVATE, USER_HOST_DEACTIVATE, HEADER_DEACTIVATE_ON_HOST, FINGERPRINTING, NO_ACTION} = constants;

async function reloadPossum(possum) {
  return await Possum.load(possum.store.diskMap.disk);
}

async function reloadEverything(possum) {
  clearState();
  await setDocumentHtml('../skin/popup.html');
  return await reloadPossum(possum);
}

describe('possum.js', function() {
  beforeEach(async function() {
    this.possum = new Possum();
    this.onBeforeRequest = this.possum.webRequest.onBeforeRequest.bind(this.possum.webRequest);
    this.onBeforeSendHeaders = this.possum.webRequest.onBeforeSendHeaders.bind(this.possum.webRequest);
    this.onHeadersReceived = this.possum.webRequest.onHeadersReceived.bind(this.possum.webRequest);
    await setDocumentHtml('../skin/popup.html');
  });

  describe('header deactivate', function() {
    it('deactivate from popup', async function() {
      let {tabId} = main_frame,
        {possum} = this,
        cookie = new Details(Object.assign(reqHeaders.copy(), third_party.copy()));

      this.onBeforeRequest(main_frame.copy());
      let strippedCookies = this.onBeforeSendHeaders(cookie.copy())

      let popup = await makePopup(tabId);

      assert.isTrue($('header-checkbox').checked);

      $('header-checkbox').checked = false;
      await popup.headerHandler();

      assert.isFalse($('header-checkbox').checked);

      assert.deepEqual(this.onBeforeSendHeaders(cookie.copy()), NO_ACTION);
      assert.deepEqual(this.possum.store.getDomain(main_frame.url).action.reason, HEADER_DEACTIVATE_ON_HOST);

      possum = await reloadEverything(possum);

      possum.webRequest.onBeforeRequest(main_frame.copy());
      assert.deepEqual(possum.webRequest.onBeforeSendHeaders(cookie.copy()), NO_ACTION);

      popup = await makePopup(tabId);
      assert.isFalse($('header-checkbox').checked);

      $('header-checkbox').checked = true;
      await popup.headerHandler();

      possum = await reloadEverything(possum);
      possum.webRequest.onBeforeRequest(main_frame.copy());
      assert.deepEqual(possum.webRequest.onBeforeSendHeaders(cookie.copy()), strippedCookies);

      popup = await makePopup(tabId);

      assert.isTrue($('header-checkbox').checked);
    });
    it('deactivates from storage', async function() {
      let cookie = new Details(Object.assign(reqHeaders.copy(), third_party.copy()));
      await this.possum.store.updateDomain(main_frame.url, (domain) => {
        domain.action = new Action(HEADER_DEACTIVATE_ON_HOST);
        return domain;
      });
      this.onBeforeRequest(main_frame.copy());
      assert.deepEqual(this.onBeforeSendHeaders(cookie.copy()), NO_ACTION);
    });
  });
  it('blocks headers', async function() {
    let {tabId} = main_frame,
      cookie = new Details(Object.assign(reqHeaders.copy(), third_party.copy()));

    this.onBeforeRequest(main_frame.copy());
    this.onBeforeSendHeaders(cookie.copy());

    let popup = await makePopup(tabId);

    assert.deepEqual(Array.from(popup.headerCounts), [['cookie', 1]]);
    let referer = new Details(Object.assign(cookie, {requestHeaders: [{name: 'referer', value: 'foo.com'}]}));
    this.onBeforeSendHeaders(referer.copy());
    assert.deepEqual(Array.from(popup.headerCounts), [['cookie', 1], ['referer', 1]]);
  });

  describe('user deactivates', function() {
    beforeEach(async function() {
      this.blocker = new Reason('block', {requestHandler: ({}, d) => d.response = CANCEL});

      this.possum.webRequest.handler.addReason(this.blocker);
      await this.possum.store.setUrl(
        details.script.url,
        new Action(this.blocker.name, {href: details.script.url})
      );

      // set tab
      this.onBeforeRequest(main_frame.copy());
    });
    it('ensure we block block it & strip cookies', function() {
      assert.deepEqual(this.onBeforeRequest(script.copy()), CANCEL);
      // assure it strips cookies
      assert.deepEqual(this.onBeforeSendHeaders(reqHeaders.copy()), {'requestHeaders': [notCookie]});
      assert.deepEqual(this.onHeadersReceived(respHeaders.copy()), {'responseHeaders': [notCookie]});
    });

    describe('unblocked urls', function() {
      beforeEach(async function() {
        let {url, tabId} = script.copy();
        await sendMessage({type: USER_URL_DEACTIVATE, url, tabId});
      });

      it('unblocks requests', function() {
        // assure it is blocked
        assert.deepEqual(this.onBeforeRequest(script.copy()), NO_ACTION);
      });

      it('does not strip cookies when the url is a 3rd party', function() {
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders.copy()), NO_ACTION);
        assert.deepEqual(this.onHeadersReceived(respHeaders.copy()), NO_ACTION);
      });

      it('shown in the popup', async function() {
        this.onBeforeRequest(script.copy());

        const {tabId, url} = details.script;
        tabsQuery.tabs = [{id: tabId}];

        let popup = new Popup(tabId);
        await popup.connect();

        assert.equal(popup.urlActions.get(url).action.reason, USER_URL_DEACTIVATE);

        await popup.urlActions.get(url).handler();

        assert.equal(popup.urlActions.get(url).action.reason, this.blocker.name);
        assert.deepEqual(this.onBeforeRequest(script.copy()), CANCEL, 'reverted');
      });
    });

    describe('deactivated hosts', async function() {
      let tabId = details.main_frame.tabId;
      beforeEach(async function() {
        this.onBeforeRequest(main_frame.copy());

        // deactivate tab
        await sendMessage({type: USER_HOST_DEACTIVATE, tabId});
      });

      it('does not block on this tab', async function() {
        // not blocked on this tab
        let script_result = this.onBeforeRequest(script.copy());
        assert.deepEqual(script_result, NO_ACTION);

        // re-activate tab
        await sendMessage({type: USER_HOST_DEACTIVATE, tabId});

        // blocked again
        assert.deepEqual(this.onBeforeRequest(script.copy()), CANCEL);
      });

      it('does not strip headers', async function() {
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders.copy()), NO_ACTION);
        assert.deepEqual(this.onHeadersReceived(respHeaders.copy()), NO_ACTION);

        // re-activate tab
        await sendMessage({type: USER_HOST_DEACTIVATE, tabId});

        // assure it strips cookies again
        assert.deepEqual(this.onBeforeSendHeaders(reqHeaders.copy()), {'requestHeaders': [notCookie]});
        assert.deepEqual(this.onHeadersReceived(respHeaders.copy()), {'responseHeaders': [notCookie]});
      });
    });
  });

  describe('etag', function() {
    let header = {name: 'etag', value: 'value'},
      header2 = {name: 'etag', value: 'new value'},
      etag = new Details(Object.assign(script.copy(), {responseHeaders: [header]})),
      etag2 = new Details(Object.assign(script.copy(), {responseHeaders: [header2]}));
    function loadPage(possum) {
      possum.webRequest.onBeforeRequest(main_frame.copy());
    }
    beforeEach(function() {
      loadPage(this.possum);
    });
    it('blocks unknown etags', function() {
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag.copy()), {'responseHeaders': []});
    });
    it('blocks etag if it changes the 2nd time', function() {
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag.copy()), {'responseHeaders': []});
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag2.copy()), {'responseHeaders': []});
    });
    it('all etags are blocked once resource is known to track', function() {
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag.copy()), {'responseHeaders': []});
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag2.copy()), {'responseHeaders': []});
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag.copy()), {'responseHeaders': []});
    });
    it('allows the same etag the 2nd time', function() {
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag.copy()), {'responseHeaders': []});
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag.copy()), NO_ACTION);
    });
    it('all etags are allowed once resource is known to be safe', function() {
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag.copy()), {'responseHeaders': []});
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag.copy()), NO_ACTION);
      assert.deepEqual(this.possum.webRequest.onHeadersReceived(etag2.copy()), NO_ACTION);
    });
  });

  describe('fingerprinting', function() {
    function loadPage(possum) {
      // load a page, with a script
      possum.webRequest.onBeforeRequest(main_frame.copy());
      possum.webRequest.onBeforeRequest(script.copy());
      possum.webRequest.onBeforeRequest(first_party_script.copy());
    }
    beforeEach(async function() {
      // load a page, with a script
      loadPage(this.possum);

      // page see's fingerprinting and sends message
      await sendMessage(
        {type: FINGERPRINTING, url: details.script.url},
        toSender(main_frame.copy())
      );
    });

    describe('deactivate', function() {
      let {url, tabId} = script.copy();
      beforeEach(async function() {
        await sendMessage({type: USER_URL_DEACTIVATE, url, tabId});
      });
      it('doesnt block when deactivated', function() {
        assert.deepEqual(this.possum.webRequest.onBeforeRequest(script.copy()), NO_ACTION);
      });
      it('new fingerprinting message does not override deactivate', async function() {
        await sendMessage({type: FINGERPRINTING, url}, toSender(main_frame.copy()));
        assert.deepEqual(this.possum.webRequest.onBeforeRequest(script.copy()), NO_ACTION);
      });
    });

    describe('first party fingerprinting', function() {
      beforeEach(async function() {
        await sendMessage(
          {type: FINGERPRINTING, url: details.first_party_script.url},
          toSender(main_frame.copy())
        );
      });

      it('does not block firstparty fingerprinting scripts', function() {
        let result = this.onBeforeRequest(first_party_script.copy());
        assert.deepEqual(result, NO_ACTION);
      })

      it('alerts the page script', function() {
        let fps = first_party_script.copy(),
          {tabId, frameId} = fps;

        this.onBeforeRequest(fps);
        let message = tabsOnMessage.messages[tabsOnMessage.messages.length - 1];
        assert.deepEqual(message, [
            tabId,
            {type: 'firstparty-fingerprinting', url: first_party_script.url},
            {frameId},
        ]);
      })
    });

    it('blocks fingerprinting after it is detected', function() {
      // another request for the fingerprinting script is made
      let result = this.onBeforeRequest(script.copy());
      assert.deepEqual(result, CANCEL);
      getBadgeText({tabId: details.script.tabId}, (text) => assert.equal(text, '1'));
    });

    it('still blocks fingerprinting after loading from disk', async function() {
      let possum2 = await Possum.load(this.possum.store.diskMap.disk);

      possum2.webRequest.onBeforeRequest(main_frame.copy());
      let result = possum2.webRequest.onBeforeRequest(script.copy());
      assert.deepEqual(result, CANCEL);
    });

    it('loads 2 blocked paths', async function() {
      let url2 = new URL(details.script.url);
      url2.pathname = '/otherpath.js';

      let details2 = new Details(Object.assign(script.copy(), {url: url2.href}))
      this.onBeforeRequest(details2);

      await sendMessage(
        {type: FINGERPRINTING, url: details2.url},
        toSender(main_frame.copy())
      );

      let possum2 = await Possum.load(this.possum.store.diskMap.disk);
      possum2.webRequest.onBeforeRequest(main_frame.copy());

      let result = possum2.webRequest.onBeforeRequest(script.copy()),
        result2 =  possum2.webRequest.onBeforeRequest(details2);
      assert.deepEqual(result, CANCEL);
      assert.deepEqual(result2, CANCEL);
      getBadgeText({tabId: details2.tabId}, (text) => assert.equal(text, '2'));
    })

    describe('popup', async function() {
      let {tabId} = details.script,
        url = details.script.url;

      async function resetPagePossumPopup(possum, tabId) {
        possum = await reloadEverything(possum);
        loadPage(possum);
        return [possum, await makePopup(tabId)];
      }

      beforeEach(async function() {
        this.popup = await makePopup(tabId);
      });
      it('is shown in the popup', function() {
        assert.equal(this.popup.urlActions.get(url).action.reason, FINGERPRINTING);
        assert.include($('actions').innerHTML, url)
      });
      it('unblock fp in the popup', async function() {
        let {possum, popup} = this;
        // clicking changes action FP -> user deactivated
        await popup.urlActions.get(url).handler();

        [possum, popup] = await resetPagePossumPopup(possum, tabId);

        assert.include($('actions').innerHTML, USER_URL_DEACTIVATE);
        assert.notInclude($('actions').innerHTML, FINGERPRINTING);

        // now click changes action user deactivated -> removed
        await popup.urlActions.get(url).handler();

        [possum, popup] = await resetPagePossumPopup(possum, tabId);

        assert.include($('actions').innerHTML, FINGERPRINTING);
        assert.notInclude($('actions').innerHTML, USER_URL_DEACTIVATE);
      });
    });
  });
});
