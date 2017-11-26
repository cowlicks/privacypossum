"use strict";

const {Popup} = require('./popup');

chrome.tabs.getCurrent(tab => window['popup'] = new Popup(tab.id).connect());
