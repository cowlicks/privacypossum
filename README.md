[![Build Status](https://travis-ci.org/cowlicks/privacypossum.svg?branch=master)](https://travis-ci.org/cowlicks/privacypossum)

![logo](/src/media/logo-med256.png)

Install for [Chrome](https://chrome.google.com/webstore/detail/privacy-possum/ommfjecdpepadiafbnidoiggfpbnkfbj) and for [Firefox](https://addons.mozilla.org/en-US/firefox/addon/privacy-possum/).

Privacy Possum makes tracking you less profitable.
Companies gobble up data about you to create an asymmetry of information that they leverage for profit in ever expanding ways.
Their profit comes from your informational disadvantage.
Privacy Possum monkey wrenches common commercial tracking methods by reducing and falsifying the data gathered by tracking companies.

# Current Features

* Blocks cookies that let trackers uniquely identify you across websites
* Blocks `refer` headers that reveal your browsing location
* Blocks `etag` tracking which leverages browser caching to uniquely identify you
* Blocks browser fingerprinting which tracks the inherent uniqueness of your browser

# Threat Model

__Privacy Possum does not have a threat model.__ Weird huh? We prioritize costing tracking companies money over protecting you. When considering some anti-tracking measure we do not ask "Is it possible to circumvent this?". Instead we ask "Is it cost-effective for a tracking company to circumvent this?". If the answer is "yes, no" we accept it.

Tracking companies are growing, they own more infrastructure, and make more money than ever. This means they have a growing economic, technical, and political influence. And they are guiding the internet into a ever less private place.

We think tackling the problem from an economic angle is extremely important, and will ultimately help shift the internet into more private place.


# Related Projects

## Why not Privacy Badger?

[Privacy Badger](https://github.com/EFForg/privacybadger) is another privacy focused browser extension maintained by the Electronic Frontier Foundation.
I worked for the EFF on the project full time for 6 months, and found that its current privacy benefits to be limited.
Adding new privacy protections was difficult, or impossible with the current architecture.
And the project maintainers were not interested in fixing these issues.

Comparisons with other anti-tracking projects can be found [here](docs/).

# Tracker Blocking

## Browser Fingerprinting

Sites can inspect aspects of your browser itself to determine its uniqueness, and therefore track you. This tracking technique is widely used.

Privacy Badger's fingerprinting blocking has a large deficiency, when fingerprinting is detected, the *origin* is marked as tracking (not the URL). So everything from that origin is blocked in a 3rd party context. This is a problem because it can lead you to block everything from a cdn. To get around this, Privacy Badger adds CDN's to the "cookieblock list". This prevents cookies from being sent to origin's on the list. However, it then *prevents* fingerprinting scripts from being blocked, thus allowing fingerprinting.

For example [many sites](https://publicwww.com/websites/cdn.jsdelivr.net%2Fnpm%2Ffingerprintjs2/) load fingerprintjs2 from the jsdelivr CDN, but this is on Privacy Badger's [cookie block list](https://github.com/EFForg/privacybadger/blob/08b61e85e5c361fe8b535ec9e33950431e28632a/src/data/yellowlist.txt#L314). So Privacy Badger will allow sites to load this script fingerprint you.

Fingerprinting usually aggregates information across many esoteric browser API's, so we watch for this behavior. When we detect it, we block it.

However many sites load first party fingerprinting code alongside other necessary code, like on reddit.com, so we can't simply block the script, or it will break the page. Instead when we see first party fingerprinting, we inject random data to spoil the fingerprint. Visit [valve.github.io/fingerprintjs2](https://valve.github.io/fingerprintjs2/) to see this. "get your fingerprint" multiple times, and see it change each time.

## Cookie Tracking

Most online tracking happens through cookies.

Privacy Possum blocks all 3rd party cookies.

## Etag Tracking

Etags are a well known tracking vector, commonly used in lieu of cookies. 

We detect and block third party etags as follows:
* The first time you see a request to a 3rd party url with an etag, strip the etag header and store its value.
* The second time you see a 3rd party request to this url, compare the new etag you get with the old one.
     - If they are the same, this is not a tracking etag, allow etags for this url now and in the future.
     - If they are different, do not allow etags for this url now or in the future.

Chrome withholds the `if-none-match` headers from `onBeforeSendHeaders` (https://developer.chrome.com/extensions/webRequest#Life_cycle_of_requests).
So we can't prevent the browser from revealing some data via sending cache information, we are only able to intercept incoming etags from sources that are not already cached.

## Referer headers

Referer headers are not exactly used for tracking themselves. But they are used in conjunction with other methods to track you. So we block them, and use a simple algorithm to unblock them when this causes problems.
* Block `referer` headers to 3rd party sources
* If the source responds with bad status code, we retry with the header added back in

## 301 Moved Permanent Redirect Tracking

If you visit a site, it might load a resource that has a 301 redirect. The resource can redirect you to url that is *unique* to you. Then, the next time you see the original resource, your browser will load the unique url from the cache, and fetch the resource from there. Making you uniquely identified.

This is a well known technique, but its pervasiveness is unknown to me.

One solution to this would be to use cached 301 redirects from 3rd party sources.

However we have not found a way to disable the cache like this in chrome's extension api. It is possible to intercept the redirect, but if you redirect back to the original url, you fetch from the cache again.
One hack to disable the cache is to append a dummy query parameter, like `?` or `&`. With this you can re-try the url redirect to determine if it is unique per request.

If this tests positive for a tracking redirect, we can't simply bust the cache every time by appending dummy query parameters because we'd end up with urls like `https://foo.com/?&&&&&&&&&&&&&&&....`.

The next best solution would be to just block the request. This is yet to be implemented.

# Development

## Dependencies

The packaged extension contains *no* external dependencies. However we have several local dependencies we manually update for development purposes. First, we maintain our own copy of Mozilla's Public Suffix List, and Privacy Badger's Multi-domain First Parties list. These are used to determine if a given domain is "first party" or "third party". We also have a copy of React and ReactDOM.

There are dependencies for development. These are all installed by running `npm install` inside `src/js`.

## Module System

We use a lightweight implementation of nodes `require` function to implement modules without requiring a compilation step between running in the browser, and running in node.

For this to work, we wrap each module in code like this (from `src/js/reasons/utils.js`):

```js
"use strict";

[(function(exports) {

...

Object.assign(exports, {sendUrlDeactivate, ...});

})].map(func => typeof exports == 'undefined' ? define('/reasons/utils', func) : func(exports));
```
Note the path to this module must be passed in as a string to the `define` function.
Exported stuff is assigned to properties on `exports` just like in node.

## Releases

* edit the manifest.json version number to the form year.month.day with no leading zeros.
* save and commit
* run `make release`, this tags the repo with the manifest version and builds a zip file
* test the zip file in a fresh instances of supported browsers.
    - for chrome run `google-chrome --user-data-dir=$(mktemp -d)` install the zip by dragging it to the chrome://extensions/ page.
    - for firefox run `firefox --profile $(mktemp -d) --no-remote --new-instance`. Go to `about:debugging` and click load temporary addon. Navigate to the zip file.
    - Do some basic Q&A tests, visit https://valve.github.io/fingerprintjs2/ https://reddit.com/ https://twitch.tv/ https://duckduckgo.com/
* upload the zip.
    - for chrome visit https://chrome.google.com/webstore/developer/edit/ommfjecdpepadiafbnidoiggfpbnkfbj record any other edits to the chrome store profile in this repo
    - for firefox visit https://addons.mozilla.org/en-US/developers/addon/privacy-possum/edit
* notify users

## Testing

From inside `src/js/` you can run node tests with `npm test`, check coverage with `npm run cover`, and run selenium tests inside `selenium/` by running `npm test`.
