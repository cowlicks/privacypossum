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
* add firstparty-fingerprinting to constants
* modify bootstrap code to take a path string.
* add USER_BLOCK to reason and use it in tests
* inject bad data into fingercounting
* fix script locating issues. Throws error when accessed in terminal. (see bugs bookmarks).
* fix issue inspecting popup throws an exception. Issue where reloading extension throws errors for missing tabs.
* strip 1st party refer headers too?
* add url deactivate to popup, add tests, make sure deactivated urls show up in popup, and can be toggled
* add html tooling
* replace popup logo with on/off button
* show user-deactivated urls in popup
* put message clearing for tests in root beforeEach
* markresponse -> markAction, macke it take an action as an argument
* today -> rename markResponse, refactor so popup items are done as part of reasons, add.in_popup property, add popup messages to reasons
* adding all this stuff to reasons, it'd be nice for them to be more flexible, in their own directory, should refactor bootstrap stuff to make this easier
* test bootstrap.js, add logging
* add logging in bootstrap

## techniques

We block *all* thirdparty cookies. PB spends a lot of energy inspecting third
party coookies, then trying to detect if they are tracking, then blocking the
domains they use. Howevever we can almost *always* block *all* third party
cookies and not break anything. This eliminates a lot of tracking.

We also strip referer headers, with cookies already blocked, this adds little
to *your* privacy. But it does effect the 3rd parties analytics so they will
know less about where their content is being used.

We detect fingerprinting and block it in a first, and third party context.

for first parties, we don't outright block the request, because it is more
likely bundled with code that is essential to functionality of the website.

## data structures

We store domain-name related data in a heirarchical tree data-structure, TLD's at the root, like the real DNS system. This lets us store aggregate data easily. So we can get all urls with a certain hostname which we store data for, or all subdomains of a given hostname, etc. The data structure has synchronouse gets, and asynchronous sets.

## goals

Keep the codebase small with few external dependencies.

Keep the codebase easy to build and develop.
We prefer to have the extension runnable without any build tools. So it can be through the extension menu.
Put fewer layers of abstraction between developer and install.

## threats

The "threat model" of this project is not purely induvidual. The threat it
adresses is the tracking industry. So not all measures in this project are
intended to protect you from all tracking, but they are intended to protect you
from common commercial tracking.

We want to threaten trarcking on a large scale, we want to be the threat model
of the tracking industry.
