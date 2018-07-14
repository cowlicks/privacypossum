"use strict";

const INTERACTION = 'interaction',
  clicked = new Set();

function urlToHostname(url) {
  return (new URL(url)).hostname;
}

document.addEventListener('mousedown', function(e) {
  if (e.isTrusted) {
    const hostname = urlToHostname(e.target.baseURI);
    if (!clicked.has(hostname)) {
      clicked.add(hostname);
      chrome.runtime.sendMessage({
        type: INTERACTION,
        hostname
      });
    }
  }
});
