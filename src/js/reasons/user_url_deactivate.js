import {USER_URL_DEACTIVATE, NO_ACTION} from '../constants.js';
import {log} from '../utils.js';
import {setResponse, sendUrlDeactivate} from './utils.js';
import {Action} from '../schemes.js';

async function onUserUrlDeactivate({store, tabs}, {url, tabId}) {
  await store.updateUrl(url, currentAction => {
    let action;
    log(`got user deactivate message for action: '${currentAction.reason}' with url: '${url}'`);
    if (currentAction.reason === USER_URL_DEACTIVATE) {
      action = currentAction.getData('deactivatedAction');
      log(`reactivating action: '${action.reason}' for url: '${url}'`);
    } else {
      action = new Action(USER_URL_DEACTIVATE, {
        href: url,
        deactivatedAction: currentAction,
      });
      log(`deactivating action: '${currentAction.reason}' for url: '${url}'`);
    }
    tabs.markAction(action, url, tabId);
    return action;
  });
}

const urlDeactivateReason = {
  name: USER_URL_DEACTIVATE,
  props: {
    requestHandler: setResponse(NO_ACTION, true),
    messageHandler: onUserUrlDeactivate,
    popupHandler: sendUrlDeactivate,
  },
}

export {onUserUrlDeactivate, urlDeactivateReason};
