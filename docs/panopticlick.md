Why doesn't panopticlick trigger?

TL;DR Panopticlick and Am I Unique use a homerolled assortment of tracking code that is impractical for commercial tracking.

I'll go into a little detail about Panopticlick to explain more. Panopticlick uses a deployment of the open source fingerprinting tool Fingerprintjs2, along with their own unique fingerprinting code.

I added some debug code and visited Panopticlick I see Privacy Possum detects the page accessing 12 API's that are marked for watching for fingerprinting. Except this is split over 3 different scripts:
https://panopticlick.eff.org/static/fp2.js
https://panopticlick.eff.org/static/fetch_whorls.js
https://panopticlick.eff.org/static/deployJava.js

Privacy watches for fingerprinting on *per script basis*, this is a reasonable assumption because, normally a websites tracking code is bundled into one place, so that the tracking info can be easily aggregated and used. I'm not aware of a real deployment where tracking is split up like this. It is practical for panopticlick (and Am I Unique) because they want to present information about your tracking independently, and manage the code to do that in a more practical way.

For a demonstration of the fingerprinting detection code, I usually point folks to:
https://github.com/Valve/fingerprintjs2 

I think it is worth considering cases like Panopticlick, or Am I Unique, because they can be used to evade PP's novel detection. But I have not seen a case like this in the wild.
