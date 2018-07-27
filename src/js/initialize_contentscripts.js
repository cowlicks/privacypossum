"use strict";

let {makeFingerCounting} = require('./contentscripts/fingercounting');
let event_id = Math.random();

// listen for messages from the script we are about to insert
document.addEventListener(event_id, function (e) {
  if (e.detail.type === 'fingerprinting') {
    chrome.runtime.sendMessage(e.detail);
  }
});

// we wait for the script to say its ready
let ready = new Promise(resolve => {
  document.addEventListener(event_id, function (e) {
    if (e.detail.type === 'ready') {
      resolve(); // script is ready to receive data
    }
  });

  // insert script now that ready listener is listening.
  const scriptTag = document.createElement('script'),
    blob = new Blob([`(${makeFingerCounting.toString()})(${event_id})`], {type: 'text/javascript'}),
    url = URL.createObjectURL(blob);
  scriptTag.src = url;
  scriptTag.onload = function() {
    this.remove();
    URL.revokeObjectURL(url);
  };
  (document.head || document.documentElement).appendChild(scriptTag);
});

chrome.runtime.onMessage.addListener(message => {
  if (message.type === 'firstparty-fingerprinting') {
    ready.then(() => {
      document.dispatchEvent(new CustomEvent(event_id, {detail: message}));
    });
  }
});
