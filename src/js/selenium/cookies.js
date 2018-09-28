'use strict';

const express = require('express'),
  {createServer} = require('http'),
  vhost = require('vhost');

let fp = {cookie: {name: '1pname', value: '1pvalue'}},
  tp = {cookie: {name: '3pname', value: '3pvalue'}};

class App {
  constructor(app, hostname1, hostname2, port) {
    let app1 = firstParty(hostname2, port),
      app2 = thirdParty(port);
    app.use(vhost(hostname1, app1));
    app.use(vhost(hostname2, app2));
    Object.assign(this, {app, hostname1, hostname2, port});
  }

  async runWith(func) {
    this.listen();
    await func()
    this.close();
  }
  listen(port=this.port) {
    this.server = createServer(this.app);
    this.server.listen(port);
  }
  close() {
    this.server.close();
  }
}

function firstParty(hostname, port) {
  const app = express();
  app.get('/', (req, res) => {
    console.log('got request');
    res.cookie(fp.cookie.name, fp.cookie.value);
    return res.send(
      `<script type="text/javascript" src="http://${hostname}:${port}/tracker.js"></script>`
    );
  });
  return app;
}

function thirdParty(port) {
  const app = express();
  app.get('/tracker.js', (req, res) => {
    res.cookie(tp.cookie.name, tp.cookie.value);
    console.log('third party hit');
    return res.send('console.log("third party script")');
  });
  return app;
}

Object.assign(module.exports, {App});
