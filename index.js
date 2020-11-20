const puppeteer = require('puppeteer-core');
let fs = require('fs');

const executablePath = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";

run();

async function run() {
  // OPTION 2 - Connect to existing.
  // MAC: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
  // PC: start chrome.exe –remote-debugging-port=9222
  // Note: this url changes each time the command is run.
  const url = 'localhost:9222';
  const id = 'ED4A32135E91AE4B26530407792A641A';
  const wsChromeEndpointUrl = `ws://${url}/devtools/browser/${id}`;

  try {
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointUrl
    });
  
    const [page] = await browser.pages();
    const noOfCards = await page.$$eval('#scroll-contents > div', divs => divs.length);
    console.log("test", noOfCards, page);
  } catch (e) {
    console.log(e);
  }
}

// access websocket json:
// http://localhost:9222/json