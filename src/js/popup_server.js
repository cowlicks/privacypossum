import {shim} from './shim.js';
const {onConnect} = shim;

import {POPUP} from './constants.js';
import {Model, log} from './utils.js';
import {currentTab} from './browser_utils.js';

class Server {
  constructor(tabs) {
    this.tabs = tabs;
    this.connections = new Map();
  }

  start() {
    onConnect.addListener(port => {
      if (port.name === POPUP) {
        currentTab().then(tab => {
          log(`Opening popup for tab: ${tab.id}`);
          let model = new Model(port, this.tabs.getTab(tab.id));
          this.connections.set(tab.id, model);
          port.onDisconnect.addListener(() => {
            log(`Removing popup connection for tab: ${tab.id}`);
            this.connections.delete(tab.id);
            model.delete();
          });
        });
      }
    });
  }
}

export {Server};
