# Roadmap

* add blocker blocking
* surrogates
* widgets
* spoil fingerprints done
* rules like:
    - youtube -> youtube-nocookie
    - inject header for twitter

* t.co unwrapping

* evercookie/supercookie protection, start with localstorage read/write in 3rd party frames
* multiple Reasons on a single thing
* test 1st party fingerprinting behavior !!!!!
* modify bootstrap code to take a path string.
* add USER_BLOCK to reason and use it in tests
* inject bad data into fingercounting
* fix script locating issues. Throws error when accessed in terminal.
* fix issue inspecting popup throws an exception. Issue where reloading extension throws errors for missing tabs.
* strip 1st party refer headers too?

## techniques

We block *all* thirdparty cookies. PB spends a lot of energy inspecting third
party coookies, then trying to detect if they are tracking, then blocking the
domains they use. Howevever we can almost *always* block *all* third party
cookies and not break anything. This eliminates a lot of tracking.

We also strip referer headers, with cookies already blocked, this adds little
to *your* privacy. But it does effect the 3rd parties analytics so they will
know less about where their content is being used.

We detect fingerprinting and block it in a first, and third party context.

for first parties, we don't outright block the request, because it is more likely bundled with code that is essential to functionality of the website.

## threats

The "threat model" of this project is not purely induvidual. The threat it
adresses is the tracking industry. So not all measures in this project are
intended to protect you from all tracking, but they are intended to protect you
from common commercial tracking.

We want to threaten trarcking on a large scale, we want to be the threat model
of the tracking industry.
