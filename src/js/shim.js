"use strict";

(function(exports) {

let url_;
try {
  url_ = URL;
} catch (e) {
  url_ = require('url').URL;
}

Object.assign(exports, {URL: url_});

})(typeof exports == 'undefined' ? require.scopes.shim = {} : exports);
