#!/usr/bin/env node
/* eslint-disable global-require, no-console, no-shadow */

const fs = require('fs');
const path = require('path');

const QRCode = require('qrcode');

const addonIdsWithQRCodes = require('../config/lib/addonIdsWithQRCodes');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const destDir = path.join(distDir, 'qrcodes');
const lang = 'en-US';
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir);
}

(async () => {
  const res = await fetch(
    `https://addons.mozilla.org/api/v5/addons/search/?app=android&promoted=recommended&type=extension&lang=${lang}`
  );
  const { results: addons } = await res.json();

  await Promise.all(
    addons.map(({ id, url }) => {
      const filePath =   path.join(destDir, `${id}.png`);
      let content = url.replace(`/${lang}`, '');
      content = [
        `${content}?utm_campaign=amo-fenix-qr-code`,
        `utm_content=${id}`,
        `utm_medium=referral&utm_source=addons.mozilla.org`,
      ].join('&')
      return QRCode.toFile(filePath, content, {margin: 1});
    })
  );

  const knownIds = addonIdsWithQRCodes.addonIds;
  const addonIdsFromAPI = addons.map(({ id }) => id);

  for (const addonId of addonIdsFromAPI) {
    if (!knownIds.includes(addonId)) {
      console.log(`'addonIdsWithQRCodes' might be outdated:`);
      console.log(`  addonIdsWithQRCodes=${knownIds.sort()}`);
      console.log(`  IDs from API=${addonIdsFromAPI.sort()}`);
      process.exit(1);
    }
  }

  console.log(addons.length, ' QR codes created');
})();
