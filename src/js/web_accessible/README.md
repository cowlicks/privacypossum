This directory should only contain scripts that will be web accessible.

# Notes from developing fingeprinting.

### thoughts for a metric over the counts

We can think about each finger printing method a dimension in N dimensional
space. Then we can think about this as a metric on an N dimensional vector.
where each fingerprinting method maps to an element of this vector.

A first naive metric can be the count of all elements of the vector that are
non-zero. The higher the metric, the more likely the fingerprinting.

Later to improve the metric, we can add weights to each dimension, and
consider the number of times each function is called.

Hopefully this will work okay, it kinda assumes the dimensions are linearly
independent. This certainly isn't true. Once we have more data, we can
empirically determine a transformation function that would account for
non-independence.

test sites found with: https://publicwww.com/websites/%22fingerprint2.min.js%22/

ryanair.com  # interesting 0.8 result
biggo.com.tw
https://www.sitejabber.com/
http://www.gettvstreamnow.com/ 0.95
https://adsbackend.com/  # is this broken? lol

it seems like 0.8 is the minimum for sites using fpjs2,
0.45 is the max I've seen (from github). So I set the threshold
at 0.75 for now.

this site is loading from augur.io (I think?) and scoring 0.85.
http://www.dixipay.com/
