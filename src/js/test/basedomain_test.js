/**
 * based on https://github.com/cowlicks/privacybadgerchrome/blob/300d41eb1de22493aabdb46201a148c028a6228d/src/tests/tests/baseDomain.js
 */
/* * This file is part of Adblock Plus <http://adblockplus.org/>, * Copyright (C) 2006-2013 Eyeo GmbH *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import chai from 'chai'; const {assert} = chai;
import {getBaseDomain} from '../domains/basedomain.js';

describe('basedomain.js', function() {
  it("Determining base domain", function () {
    var tests = [
      ["com", "com"],
      ["example.com", "example.com"],
      ["www.example.com", "example.com"],
      ["www.example.com.", "example.com"],
      ["www.example.co.uk", "example.co.uk"],
      ["www.example.co.uk.", "example.co.uk"],
      ["www.example.bl.uk", "bl.uk"],
      ["foo.bar.example.co.uk", "example.co.uk"],
      ["1.2.3.4", "1.2.3.4"],
      ["[::1]", "[::1]"],
      ["[2001:db8:1f70:0:999:de8:7648:6e8]", "[2001:db8:1f70:0:999:de8:7648:6e8]"],
      ["www.example.sande.xn--mre-og-romsdal-qqb.no", "example.sande.xn--mre-og-romsdal-qqb.no"],
      ["test.xn--e1aybc.xn--p1ai", "xn--e1aybc.xn--p1ai"],
      ["www.example.xn--0trq7p7nn.jp", "example.xn--0trq7p7nn.jp"],
    ];

    for (var i = 0; i < tests.length; i++) {
      assert.equal(getBaseDomain(tests[i][0]), tests[i][1], tests[i][0]);
    }
  });
});
