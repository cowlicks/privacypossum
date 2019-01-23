# Tracking Feature Roadmap

* ad blocker blocking?
* surrogates
* widgets
* rules like:
    - youtube -> youtube-nocookie
    - inject header for twitter

* evercookie/supercookie protection, start with localstorage read/write in 3rd party frames

* tracking pixels
    -reddit sets pixels specific per ad on reddit.com. Advertisers embed a pixel in their home pages. Reddit tracks conversion between these.
* 304 Not Modified tracking - if you load a script once, `foo.com/script.js` and the server sends it with some unique id embedded in it, then the next time you load that script the server can respond that you already have that script stored. Then you will load the script, it will check the unique id.
* pixel cache tracking

# Testing roadmap

* integration testing with selenium
* travis-ci unittesting
* travis-ci selenium

# todo

* move todos to issues on github
* add promotional titles to chrome Small tile - 440x280, Large tile - 920x680, Marquee - 1400x560
* handlers should just be for dispatching stuff, not starting listeners

* update psl script to reflect new location
* error getting fingerprinting message from tabId=-1? from extension?
* error when inspect popup creates it, make currentTab work with this
* change badge text color to grey
* make icon not blurry in chrome store?
* add screenshots for chrome store, resize current ones to 1280 pixels wide and 800 pixels high
* add video of fingerprint blocking
* add a help me link to github issues or email me


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

We want to threaten tracking on a large scale, we want to be the threat model
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
