const sw = require('selenium-webdriver'),
  express = require('express'),
  vhost = require('vhost'),
  etagApp = require("./etagApp");

const PORT = 8000;

/*
 * in /etc/hosts this requires:
 * 127.0.0.1    etag.local
 * 127.0.0.1    thirdpartywithetag.local
 */

function loadDriverWithExtension(extPath) {
  let chromeOptions = sw.Capabilities.chrome();
  chromeOptions.set("chromeOptions",  {"args": ['--load-extension='+extPath]});
  return new sw.Builder()
      .forBrowser('chrome')
      .withCapabilities(chromeOptions)
      .build();
}

function startApps() {
  let appWithVhost = module.exports = express();
  appWithVhost.use(vhost('etag.local', etagApp(PORT))); // Serves first app
  //appWithVhost.use(vhost('admin.mydomain.local', app2)); // Serves second app

  /* istanbul ignore next */
  if (!module.parent) {
    appWithVhost.listen(PORT);
    console.log(`Express started on port ${PORT}`);
  }
}

let path = '../.',
  driver = loadDriverWithExtension(path);
startApps();

driver.get('etag.local:8000');
