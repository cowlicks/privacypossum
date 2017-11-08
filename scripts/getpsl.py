#!/usr/bin/env python
'''
Based on a Privacy Badger pull request:
https://github.com/cowlicks/privacybadgerchrome/blob/300d41eb1de22493aabdb46201a148c028a6228d/scripts/convertpsl.py
'''

# script based on
# https://github.com/adblockplus/buildtools/blob/d090e00610a58cebc78478ae33e896e6b949fc12/publicSuffixListUpdater.py

import json
import subprocess
import os

import urllib.request

psl_url = 'https://publicsuffix.org/list/public_suffix_list.dat'
psl_destination = 'src/js/basedomain/psl.js'

file_text = '''
/* eslint-disable */
"use strict";

(function(exports) {

const publicSuffixes = new Map(
%s
);

Object.assign(exports, {publicSuffixes});

})(typeof exports == 'undefined' ? require.scopes.psl = {} : exports);
'''

parse_stdout = lambda res: res.strip().decode('utf-8')
run_shell_command = lambda command: parse_stdout(subprocess.check_output(command))
get_git_root = lambda: run_shell_command(['git', 'rev-parse', '--show-toplevel'])


def get_psl_text():
    return urllib.request.urlopen(psl_url).read()


def punycode(x):
    return x.encode('idna').decode()


def convert(psl_lines):
    suffixes = []

    for line in psl_lines:
        if line.startswith('//') or '.' not in line:
            continue
        if line.startswith('*.'):
            suffixes.append([punycode(line[2:]), ])
        elif line.startswith('!'):
            suffixes.append([punycode(line[1:]), 0])
        else:
            suffixes.append([punycode(line), 1])

    entries = sorted(suffixes, key=lambda x: x[0])
    return file_text % '],\n'.join(json.dumps(entries).split('], '))


if __name__ == '__main__':
    psl_lines = get_psl_text().decode().split('\n')
    psl = convert(psl_lines)
    with open(os.path.join(get_git_root(), psl_destination), 'r+') as f:
        f.seek(0)
        f.write(psl)
        f.truncate()
