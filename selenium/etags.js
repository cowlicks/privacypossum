let express = require('express'),
  vhost = require('vhost'),
  {firstPartyHostname, thirdPartyHostname, thirdPartyHost, Channel, requestRecorderMiddleware} = require('./utils');
const ifNoneMatch = 'if-none-match';

function etagTracker(app = express()) {
  let tracked = new Map(),
    etagCount = 0;
  app.set('etag', false);
  Object.assign(app, {tracked, etagCount});
  app.use((req, res, next) => {
    if (req.headers.hasOwnProperty(ifNoneMatch) && tracked.has(req.headers[ifNoneMatch])) {
      let key = req.headers[ifNoneMatch];
      tracked.set(key, 1 + tracked.get(key));
      res.statusCode = 304;
    } else {
      res.setHeader('etag', `W/"${String(etagCount += 1)}"`);
    }
    next();
  });
  return app;
}

function firstPartyApp(app = express(), tpHost = thirdPartyHost) {
  app.get('/', (req, res) => {
    return res.send(
      `<script type="text/javascript" src="http://${tpHost}/tracker.js"></script>`
    );
  });
  return app;
}

function thirdPartyApp(app = express()) {
  app.get('/tracker.js', (req, res) => {
    return res.send('console.log("third party script")');
  });
  return app;
}

function baseTestApp(fpApp, tpApp, app = express(), fpHostname = firstPartyHostname, tpHostname = thirdPartyHostname) {
  let firstParty = firstPartyApp(fpApp),
    thirdParty = thirdPartyApp(tpApp);
  app.use(vhost(fpHostname, firstParty));
  app.use(vhost(tpHostname, thirdParty));
  Object.assign(app, {firstParty, thirdParty});
  return app;
}

function etagApp() {
  let fpApp = requestRecorderMiddleware(etagTracker()),
    tpApp = requestRecorderMiddleware(etagTracker());
  return baseTestApp(fpApp, tpApp);
}

Object.assign(module.exports, {etagApp});
