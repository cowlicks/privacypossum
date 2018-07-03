"use strict";

const INTERACTION = 'interaction';

function urlToHostname(url) {
  return (new URL(url)).hostname;
}

document.addEventListener('mousedown', function(e) {
  if (e.isTrusted) {
    chrome.runtime.sendMessage({
      type: INTERACTION,
      hostname: urlToHostname(e.target.baseURI)
    });
  }
});
