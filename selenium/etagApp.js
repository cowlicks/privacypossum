const express = require('express'),
  vhost = require('vhost');

class App {
  constructor(host, port) {
  }
}

module.exports = port => {
  const firstApp = express();
  firstApp.get('/', (req, res) => {
    console.log('got a reqest');
    return res.send(
`<script type="text/javascript" src="http://thirdpartywithetag.local:${port}/tracker.js"></script>`
    );
  });
  return firstApp;
}

/*
 * todo finish implementing the etag test based on this flask code

from flask import Flask, Response, request
app = Flask(__name__)

@app.route('/')
def hello_world():
    return '''
<script type="text/javascript" src="http://le.wtf:5000/tracker.js"></script>
Hello, World!
'''

@app.route('/tracker.js')
def tracker(): 
    resp = Response('document.documentElement.appendChild(document.createTextNode("foobar"))')
    req_if_none_match = request.headers.get('if-none-match')
    if (req_if_none_match and req_if_none_match.startswith('count:')):
        this_count = int(req_if_none_match.split(':')[-1])
        etag = 'count:%s' % (this_count + 1)
        print('increment');
    else:
        print('fresh')
        etag = 'count:0'
    resp.headers['etag'] = etag
    print(etag);
    return resp
    */
