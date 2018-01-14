![logo](/src/media/logo-med256.png)
# Tracking Feature Roadmap

* add blocker blocking
* surrogates
* widgets
* rules like:
    - youtube -> youtube-nocookie
    - inject header for twitter

* t.co unwrapping
* evercookie/supercookie protection, start with localstorage read/write in 3rd party frames

# Usuage features Roadmap

* disable actions for urls in popup
* undo disable action in popup
* disable for site

# Testing roadmap

* integration testing with selenium
* travis-ci unittesting
* travis-ci selenium

# todo

* move todos to issues on github
* handlers should just be for dispatching stuff, not starting listeners
* multiple Reasons on a single thing, so when a user action is reverted, it goes back to the original thing?

* consider injecting contentscripts programatically
* add USER_BLOCK to reason and use it in tests
* fix script locating issues. Throws error when accessed in terminal. (see bugs bookmarks).
* fix issue inspecting popup throws an exception. Issue where reloading extension throws errors for missing tabs.
* strip 1st party refer headers too?
* add url deactivate to popup, add tests, make sure deactivated urls show up in popup, and can be toggled
* add html tooling
* show user-deactivated urls in popup
* make it take an action as an argument
* refactor so popup items are done as part of reasons, add.in_popup property, add popup messages to reasons
* add popup messaging into reasons
* update psl script to reflect new location
* add MessageDispatcher to Handler
* add deletion to domain store, do disk map next.


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

t.co urls get unwrapped on twitter and tweetdeck

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

## architecture

### reasons
The ways we change normal browser behavior are defined by "reasons.js". Each way we change behavior has its own "reason".
reasons are loaded into various "handlers". Handlers intercept browser behaviour and modify them based on whatever reasons they have loaded.

### data structures

We store domain-name related data in a heirarchical tree data-structure, TLD's
at the root, like the real DNS system. This lets us store aggregate data
easily. So we can get all urls with a certain hostname which we store data for,
or all subdomains of a given hostname, etc. The data structure has synchronouse
gets, and asynchronous sets.

We also have a datastructure for monitoring tabs, and getting informationg
about them in a synchronous way. This is defined in tabs.js.

### shims

We extensively test the project headlessly. To do this, we shim all the browser extension interfaces in shim.js. We define the fake interfaces in fakes.js.
