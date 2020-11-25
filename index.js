const puppeteer = require('puppeteer-core');
const axios = require('axios');
const fs = require('fs');
const sizeOf = require('buffer-image-size');

run();

async function run() {
  const url = 'localhost:9222';
  const id = '181274ee-e138-424a-bfc4-ce307971cbb9';
  const wsChromeEndpointUrl = `ws://${url}/devtools/browser/${id}`;

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsChromeEndpointUrl
      // browserURL: 'ws://localhost:9222/devtools/page/47E5F0B0D8A6DC3DF52C6B3A302CB951',
      // defaultViewport: {
      //   width: 1366,
      //   height: 768
      // }
    });

    const [page] = await browser.pages();
    const noOfCards = await page.$$eval('#scroll-contents > div', divs => divs.length);
    console.log("noOfCards", noOfCards);
    const cardElements = await page.$$('.card');
    console.log('test', cardElements.length);

    await page.exposeFunction("getImageFromUrl", getImageFromUrl);

    const rows = [];

    for (cardElement of cardElements) {
      const cardTitle = await cardElement.$$eval('#titleBar span', options => options.map(option => option.textContent));
      let resources = await cardElement.$$eval('[data-src]', nodes => nodes.map(el => {
        const src = el.getAttribute('data-src');
        return { src };
      }));

      await Promise.all(resources.map(async (item) => {
        try {
          const { headers, data } = await getImageFromUrl(item.src);
          const dimension = sizeOf(data);

          rows.push(`${cardTitle[0].trim()}\t${dimension.width}px\t${dimension.height}px\t${`${(parseInt(headers['content-length']) * 0.001).toFixed(1)}kb`}`);

          // return {
          //   ...item,
          //   cardTitle: cardTitle[0],
          //   fileSize: `${(parseInt(headers['content-length']) * 0.001).toFixed(1)}kb`,
          //   width: dimension.width,
          //   height: dimension.height
          // };
        } catch {
          console.log('Error: ', item.src);
        }
      }));
    }
    const header = ["Card Title\tWidth\tHeight\tFile Size"];
    const tsvStr = header.concat(rows).join("\n");

    console.log(tsvStr);

    fs.writeFile(`${__dirname}/result.tsv`, tsvStr, 'utf8', err => {
      if (err) {
        console.log('Error writing to tsv file', err);
      } else {
        console.log(`saved as result.tsv`);
      }
    });
  } catch (e) {
    console.log(e);
  }
}

const getImageFromUrl = async function (url) {
  return await axios.get(url, {
    responseType: 'arraybuffer'
  });
};
