import {shim} from '../shim.js';
import {REMOVE_ACTION, USER_URL_DEACTIVATE} from '../constants.js';

const {sendMessage} = shim;

function setResponse(response, shortCircuit) {
  return ({}, details) => Object.assign(details, {response, shortCircuit});
}

function makeSendAction(type) {
  return function({}, url, tabId) {
    return sendMessage({type, url, tabId});
  };
}

const sendUrlDeactivate = makeSendAction(USER_URL_DEACTIVATE),
  sendRemoveAction = makeSendAction(REMOVE_ACTION);

export {sendUrlDeactivate, sendRemoveAction, setResponse};
