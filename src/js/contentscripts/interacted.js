"use strict";

[(function(exports) {

const INTERACTION = 'interaction',
  clicked = new Set();

function urlToHostname(url) {
  return (new URL(url)).hostname;
}

function initialize() {
  document.addEventListener('mousedown', function(e) {
    if (e.isTrusted) {
      const hostname = urlToHostname(e.target.baseURI);
      console.log(hostname);
      if (!clicked.has(hostname)) {
        clicked.add(hostname);
        chrome.runtime.sendMessage({
          type: INTERACTION,
          hostname
        });
      }
    }
  });
}

Object.assign(exports, {initialize});

})].map(func => typeof exports == 'undefined' ? define('/contentscripts/interacted', func) : func(exports));
