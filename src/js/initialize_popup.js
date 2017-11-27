"use strict";

const {Popup, currentTab} = require('./popup');

let popup;
currentTab().then(tab => {
  popup = new Popup(tab.id);
  popup.connect();
});
