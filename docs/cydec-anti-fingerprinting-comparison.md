Comparison with CyDec Platform Anti-Fingerprinting

A brief review of the codebase showed spoofing of:
* `window.screen.*`
* `Date().getTimezoneOffset`
* `HTMLCanvasElement.prototype.getContext`
* `HTMLCanvasElement.prototype.toDataURL`
* and the user agent sent with each request, but not in each page's javascript context

This spoofing is done for *every page* and request.

Privacy Possum spoofs all these except `toDataUrl` (more on this later). But the way PP spoofs is very different. We spoof only when fingerprinting is detected, and then we only spoof the specific fingerprinting scripts. We do this because commercial fingerprinting has been easy to detect with our heuristic, and because spoofing has the potential to break websites. Then when we do spoof, we spoof a lot more data. Testing on [fingerprintjs2's test page](https://valve.github.io/fingerprintjs2/), PP spoofs 11 fields, CyDec spoofs 3 (and notably not the User Agent).

It is possible a website could configure fingerprintjs2 to disable these 3 fingerprinting vectors to circumvent CyDec's anti-fingerprinting measures. For the website to do this with PP they would have to disable 11 vectors. Since fingerprinting tools add many fingerprinting vectors into one fingerprint to increase its uniqueness. So disabling as many as possible decreases your uniqueness.

Privacy Possum probably should spoof `toDataUrl`, since this is usually used to dump the results of some canvas fingerprinting into a hashable format.

There is also a very odd & suspicious thing CyDec does, it frequently makes requests to localhost:61006, it has something to do with spoofing useragents. Does anyone know why?

One simple improvement CyDec could make is to also spoof the user agent in the webpage itself.

Privacy Possum does several things that CyDec does not. Among other things it blocks 3rd party cookie tracking, etag tracking, and refer data collection. On top of current tracker blocking methods, it is built on top of an extensible framework that allows for heuristics for other tracking techniques to be added.
