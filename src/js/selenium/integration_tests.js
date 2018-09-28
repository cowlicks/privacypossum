'use strict';

const sw = require('selenium-webdriver'),
  express = require('express'),
  {App} = require("./cookies");

const PORT = 8000,
  host = (hostname, port) => `${hostname}:${port}`,
  firstPartyHostname = 'firstparty.local',
  thirdPartyHostname = 'thirdparty.local',
  firstPartyHost = host(firstPartyHostname, PORT),
  thirdPartyHost = host(thirdPartyHostname, PORT);

/*
 * in /etc/hosts this requires:
 * 127.0.0.1    etag.local
 * 127.0.0.1    firstparty.local
 * 127.0.0.1    thirdparty.local
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

let app = new App(module.exports = express(), firstPartyHostname, thirdPartyHostname, PORT);

let path = '../.',
  driver = loadDriverWithExtension(path);

app.listen(PORT);
driver.get(firstPartyHost);
