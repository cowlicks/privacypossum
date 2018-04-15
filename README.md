![logo](/src/media/logo-med256.png)

Privacy Possum makes tracking you less profitable.
Companies gobble up data about you to create an asymmetry of information that they leverage for profit in ever expanding ways.
They're profit comes from your informational disadvantage.
Privacy Possum monkey wrenches common commercial tracking methods by reducing and falsifying the data gathered by tracking companies.

# Current features

* blocks cookies that let trackers uniquely identify you across websites
* blocks `refer` headers that reveal your browsing location
* blocks `etag` tracking which leverages browser caching to uniquely identify you, even in incognito mode
* blocks browser fingerprinting which tracks the inherent uniqueness of you browser

# Why not Privacy Badger?

[Privacy Badger](https://github.com/EFForg/privacybadger) is another privacy focussed browser extension maintained by the Electronic Frontier Foundation.
I worked for the EFF on the project full time for 6 months, and found that it's current privacy benefits to be limited.
Adding new privacy protections was difficult, or impossible with the current architecture.
And the project maintainers were not interested in fixing these issues.

# Tracker blocking

## browser fingerprinting

Sites can inspect aspects of your browser itself to determine its uniqueness, and therefore track you. This tracking technique widely used.

Privacy Badger's fingerprinting blocking has a large deficiency, when fingerprinting is detected, the *origin* is marked as tracking (not the URL). So everything from that origin is blocked in a 3rd party context. This is a problem because it can lead you to block everything from a cdn. To get around this, Privacy Badger adds CDN's to the "cookieblock list". This prevents cookies from being sent to origin's on the list. However, it then *prevents* fingerprinting scripts from being blocked, thus allowing fingerprinting.

For example [many sites](https://publicwww.com/websites/cdn.jsdelivr.net%2Fnpm%2Ffingerprintjs2/) load fingerprintjs2 from the jsdelivr CDN, but this is on Privacy Badger's [cookie block list](https://github.com/EFForg/privacybadger/blob/08b61e85e5c361fe8b535ec9e33950431e28632a/src/data/yellowlist.txt#L314). So Privacy Badger will allow sites to load this script fingerprint you.

Fingerprinting ususually aggregates information across many esoteric browser API's, so we watch for this behavior. When we detect it, we block it.

However many sites load first party fingerprinting code alongside other neccessary code, like on reddit.com, so we can't simply block the script, or it will break the page. Instead when we see first party fingerprinting, we inject random data to spoil the fingerprint. Visit [valve.github.io/fingerprintjs2](https://valve.github.io/fingerprintjs2/) to see this. "get your fingerprint" multiple times, and see it change each time.

## cookie tracking

Most online tracking happens through cookies.

Privacy Possum blocks all 3rd party cookies.

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

## 301 moved permanent redirect tracking

If you visit a site, it might load a resource that has a 301 redirect. The resource can redirect you to url that is *unique* to you. Then, the next time you see the original resource, your browser will load the unique url from the cache, and fetch the resource from there. Making you uniquely identified.

This is a well known technique, but its pervasiveness is unknown to me.

One solution to this would be to used cached 301 redirects from 3rd party sources.

However we have not found a way to disable the cache like this in chrome's extension api. It is possible to intercept the redirect, but if you redirect back to the original url, you fetch from the cache again.
One hack to disable the cache is to append a dummy query parameter, like `?` or `&`. With this you can re-try the url redirect to determine if it is unique per request.

If this tests positive for a tracking redirect, we can't simply bust the cache everytime by appending dummy query parameters because we'd end up with urls like `https://foo.com/?&&&&&&&&&&&&&&&....`.

The next best solution would be to just block the request. This is yet to be implemented.

# developing

## dependencies

The packaged extension contains *no* external dependencies. However we maintain our own copy of Mozilla's Public Suffix List, and Privacy Badger's Multi-domain First Parties list. These are used to determine if a given domain is "first party" or "third party".

There are dependencies for development. These are all installed by running `npm install` inside `src/js`.

## module system

We use a lightweight implementation of nodes `require` function to implement modules without requiring a compilation step between running in the browser, and running in node.

For this to work, we wrap each module in code like this (from `src/js/reasons/utils.js`):

```
"use strict";

[(function(exports) {

...

Object.assign(exports, {sendUrlDeactivate, ...});

})].map(func => typeof exports == 'undefined' ? define('/reasons/utils', func) : func(exports));
```
Note the path to this module must be passed in as a string to the `define` function.
Exported stuff is assigned to properties on `exports` just like in node.

## releasing

* edit the manifest.json version number to the form year.month.day with no leading zeros.
* save and commit
* run release.sh, this tags the repo with the manifest version and builds a zip file
* test the zip file in a fresh instances of supported browsers.
    - for chrome run `google-chrome --user-data-dir=$(mktemp -d)` install the zip by dragging it to the chrome://extensions/ page.
    - for firefox run `firefox --profile $(mktemp -d) --no-remote --new-instance`. Go to `about:debugging` and click load temporary addon. Navigate to the zip file.
    - visit https://valve.github.io/fingerprintjs2/ https://reddit.com/
* upload the zip.
    - for chrome visit https://chrome.google.com/webstore/developer/edit/ommfjecdpepadiafbnidoiggfpbnkfbj record any other edits to the chrome store profile in this repo
    - for firefox visit https://addons.mozilla.org/en-US/developers/addon/privacy-possum/edit
* notify users

## testing

From inside `src/js/` run `npm test`. To check coverage run `npm run cover`.
