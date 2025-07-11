import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { processSample } from './src/deobfuscator.js';
import { extractKey } from './src/keyExtractor.js';

const samplesDir = './samples';
const outputDir = './output';
const keyFile = './key.txt';

if (!fs.existsSync(samplesDir)) fs.mkdirSync(samplesDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function cleanup() {
  [samplesDir, outputDir].forEach(dir => {
    fs.readdirSync(dir).forEach(file => fs.unlinkSync(path.join(dir, file)));
  });
}

const now = Math.floor(Date.now() / 1000);
const fileName = `sample-${now}.js`;
const samplePath = path.join(samplesDir, fileName);
const outputPath = path.join(outputDir, fileName);

const jsUrl = `https://megacloud.blog/js/player/a/v2/pro/embed-1.min.js?v=${now}`;

fetch(jsUrl)
  .then(res => res.text())
  .then(code => {
    fs.writeFileSync(samplePath, code);
    const success = processSample(samplePath, outputPath);
    if (!success) throw new Error("Deobfuscation failed");

    const deobfuscated = fs.readFileSync(outputPath, 'utf-8');
    const key = extractKey(deobfuscated);

    if (!key) throw new Error("Key extraction failed");

    const prev = fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf-8') : '';
    if (key !== prev) {
      fs.writeFileSync(keyFile, key);
      console.log("✅ Key updated:", key);
    } else {
      console.log("⏸ Key unchanged");
    }

    cleanup();
  })
  .catch(err => {
    console.error("❌ Error:", err.message);
    cleanup();
  });
