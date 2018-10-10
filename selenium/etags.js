'use strict';

let express = require('express'),
  {requestRecorderMiddleware, baseTestApp} = require('./utils');

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

function etagApp() {
  let fpApp = requestRecorderMiddleware(etagTracker()),
    tpApp = requestRecorderMiddleware(etagTracker());
  return baseTestApp(fpApp, tpApp);
}

Object.assign(module.exports, {etagApp});
