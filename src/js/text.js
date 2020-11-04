"use strict";

[(function(exports) {

/*
 * Should consist of strings or pure functions. Functions should document their inputs.
 */
const text = {
  title: 'Privacy Possum',
  logo_alt: "I'm a possum",
  enabled_or_disabled: (active) =>  active ? 'ENABLED' : 'DISABLED',
  on_off_instructions: (active) => `click to ${active ? 'disable' : 'enable'} for this site`,
  headers_blocked: 'Blocked tracking headers:',
  header_blocking_disabled: 'Blocking tracking headers disabled',
};

Object.assign(exports, {text});

})].map(func => typeof exports == 'undefined' ? define('/text', func) : func(exports));
