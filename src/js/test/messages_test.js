"use strict";

const assert = require('chai').assert,
  {DomainTree} = require('../domain_actions'),
  {splitter} = require('../suffixtree'),
  {FakeDisk} = require('./testing_utils'),
  {Tabs} = require('../tabs'),
  {MessageListener} = require('../messages');

function setupMessageEmitter() {
  let disk = new FakeDisk(),
    name = 'name',
    store = new DomainTree(name, disk, splitter),
    tabs = new Tabs();

  let messageEmitter = {
    addListener: function(func) {
      this.func = func;
    }
  };
  return [messageEmitter, tabs, store];
}


describe('messages.js', function() {
  it('constructs', async function() {
    let tabId = 1,
      frameId = 0,
      url = 'fingerprint.js',
      type = 'script',
      resource = {tabId, frameId, url, type};

    let [messageEmitter, tabs, store] = setupMessageEmitter();

    tabs.addResource(resource);

    let ml = new MessageListener(messageEmitter, tabs, store);
    await ml.onFingerPrinting({url}, {tab: {id: tabId}, frameId});
    let res = await ml.store.get(url);
    assert.equal(res, 'block');
  });
});
