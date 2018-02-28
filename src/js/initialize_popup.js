"use strict";

const {Popup} = require('./popup'),
  {currentTab} = require('./utils');

let popup;
currentTab().then(tab => {
  popup = new Popup(tab.id);
  popup.connect();
});
