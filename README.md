![logo](/src/media/logo-med256.png)

Privacy Possum makes tracking you less profitable.
Companies gobble up data about you to create an asymmetry of information that they leverage in ever expanding way, to make a profit.
They're profit comes from your informational disadvantage.
Privacy Possum monkey wrenches common commercial tracking methods by reducing and falsefying the data gathered by tracking companies.


# Current features

* blocks cookies that lets trackers uniquely identify you across websites
* blocks `refer` headers that reveal your browsing location
* blocks `etag` tracking which leverages browser caching to uniquely identify you, even in incognito mode
* blocks browser fingerprinting which tracks the inherent uniqueness of you browser

## Why not Privacy Badger?

[Privacy Badger]() is another privacy focuses browser extension maintained by the Electronic Frontier Foundation.
I worked on the project for quite some time, and found that it's current privacy benifits to be limted.
Adding new privacy protections was difficult, or impossible with the current architecture.
And the project maintainers were not interested in fixing these issues.

# browser fingerprinting

Visit [valve.github.io/fingerprintjs2](https://valve.github.io/fingerprintjs2/) with Privacy Possum installed for a demo.
You'll see that you get a new fingerprint each time.

* Requests for 3rd party fingerprinting scripts are cancelled
* 1st party fingerprinting is fed randomized results, see http://valve.github.io/fingerprintjs2/ for a demonstration

# Tracking Feature Roadmap

* add blocker blocking?
* surrogates
* widgets
* rules like:
    - youtube -> youtube-nocookie
    - inject header for twitter

* t.co unwrapping

* evercookie/supercookie protection, start with localstorage read/write in 3rd party frames

* tracking pixels
    -reddit sets pixels specific per ad on reddit.com. Advertisers embed a pixel in their home pages. Reddit tracks conversion between these.
* 301 (permanant) redirect cache tracking. Browser store redirects so if you make the first redirect specific per request like `foo.com/stuff -> foo.com/stuff?tracker=some-tracking_id`, then the next time the person loads that page they'll load it with the given tracking query param
* 304 Not Modified tracking - if you load a script once, `foo.com/script.js` and the server sends it with some unique id embedded in it, then the next time you load that script the server can respond that you already have that script stored. Then you will load the script, it will check the unique id.
* pixel cache tracking

## etag tracking

Disable Etag tracking for 3rd party requests. We can send a false Etag, if the
server sends back an etag that was the same as the previously set Etag, we can
verify that it is authentic since they are sending the same etag repeatedly for
the same request.

Unfortunately, chrome witholds the `if-none-match` headers from `onBeforeSendHeaders` (https://developer.chrome.com/extensions/webRequest#Life_cycle_of_requests). So we can't prevent the browser from revealing some data via sending cache information. We can still prevent 3rd parties from setting it.

We should report this as a privacy bug in chrome.

This is slightly more invasive than cookie & referer header blocking, it should probably have a seperate UI thing.

setup etag flask app, send etag in incog, with no extension, ctrl-r on etag makes client send if-none-match in incognito. ctrl-shift-r does not send if-none-match

sometimes 'if-none-match' is visible to extension

## 301 moved permanently redirects


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
* fix script locating issues. Throws error when accessed in terminal. (see bugs bookmarks).
* strip 1st party refer headers too?
* add html tooling
* update psl script to reflect new location
* add MessageDispatcher to Handler
* isThirdParty error on tabs for internal tabs
* setBadgeText error when new tab is made?
* error getting fingerprinting message from tabId=-1? from extension?
* error when inspect popup creates it, make currentTab work with this
* fix webrequest requestHandler loop
* change badge text color to grey
* add short name to manifest for chrome store
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

We want to threaten trarcking on a large scale, we want to be the threat model
of the tra1280 pixels wide and 800 pixels highcking industry.

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

# developing

## packaging

To create a zip file for distribution, inside `src/` run `git ls-files | zip possum.zip -@`

## testing
