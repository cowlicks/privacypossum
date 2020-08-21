import {activeIcons, inactiveIcons} from './constants.js';

import {shim} from './shim.js';
const {tabsQuery, tabsGet, setIcon, setBadgeText} = shim;


async function currentTab() {
  const active = true, lastFocusedWindow = true;
  return new Promise(resolve => {
    tabsQuery({active, lastFocusedWindow}, tabsFirstTry => {
      if (tabsFirstTry.length > 0) {
        resolve(tabsFirstTry[0]);
      } else { // tab not focused
        tabsQuery({active}, tabsSecondTry => {
          resolve(tabsSecondTry[0]);
        });
      }
    });
  });
}

function errorOccurred(cb = ()=>{}) {
  if (typeof chrome !== 'undefined' && chrome.runtime.lastError) {
    cb(chrome.runtime.lastError);
    return true;
  } else {
    return false;
  }
}

async function tabExists(tabId) {
  if (tabId >= 0) {
    return await new Promise(resolve => {
      tabsGet(tabId, () => {
        if (!errorOccurred()) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  } else {
    return true;
  }
}

// todo after setIcon return's a promise, make this return a promise
async function setTabIconActive(tabId, active) {
  if (await tabExists(tabId)) {
    let icons = active ? activeIcons : inactiveIcons;
    setIcon({tabId: tabId, path: icons});
  }
}

async function safeSetBadgeText(tabId, text) {
  if (await tabExists(tabId)) {
    setBadgeText({text, tabId});
  }
}

export {
  currentTab,
  errorOccurred,
  tabExists,
  setTabIconActive,
  safeSetBadgeText, 
}
