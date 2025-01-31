'use strict';
const https = require('https');
const path = require('path');
const fs = require('fs');
const pkg = require('./package.json');
const assert = require('assert');

const GITHUB_REPO = 'https://github.com/FedericoCarboni/node-ntsuspend';

const fetch = (input) => {
  return new Promise((resolve) => {
    https.request(input, (res) => {
      if (res.statusCode === 302) {
        resolve(fetch(res.headers.location));
      } else {
        resolve(res);
      }
    }).end();
  });
};

const install = async () => {
  const filename = `win32-${process.arch}_lib.node`;
  const download = `${GITHUB_REPO}/releases/download/v${pkg.version}/${filename}`;
  const dest = path.join(__dirname, filename);
  const response = await fetch(download);
  const stream = fs.createWriteStream(dest);
  stream.once('close', () => {
    const ntsuspend = require('./lib.cjs');
    assert.strictEqual(typeof ntsuspend.suspend, 'function');
    assert.strictEqual(typeof ntsuspend.resume, 'function');
    console.log(`Success: '${dest}' installed from remote '${download}'`);
  });
  response.pipe(stream);
};

const { platform, arch, env: { SKIP_NTSUSPEND_BINARY } } = process;
if (!SKIP_NTSUSPEND_BINARY && platform === 'win32' && ['x64', 'ia32'].indexOf(arch) >= 0)
  install();
