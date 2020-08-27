import {Popup} from './popup.js';
import {currentTab} from './browser_utils.js';

(async () => {
  const tab = await currentTab();
  const popup = new Popup(tab.id);
  await popup.connect();
})();
