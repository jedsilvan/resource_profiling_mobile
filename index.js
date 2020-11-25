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
      browserWSEndpoint: wsChromeEndpointUrl,
      // browserURL: 'ws://localhost:9222/devtools/page/47E5F0B0D8A6DC3DF52C6B3A302CB951',
      defaultViewport: {
        width: 1366,
        height: 768
      }
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
          // `${item.cardId},${item.cardTitle},${item.remarks}`
          // card id width	height	Fize Size	Url

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
      // console.log(resources);
      // console.log("============================");
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

// const writeToTSVFile = ()

// writeToTSVFile: function (path, result, file) {
//   const filename = `${path}/${file}.tsv`;
//   const tsvStr = helper.extractAsTSV(result).replace(/^\s*\n/gm, "");
//   fs.writeFile(filename, tsvStr, 'utf8', err => {
//     if (err) {
//       console.log('Error writing to tsv file', err);
//     } else {
//       console.log(`saved as ${filename}`);
//     }
//   });
// },

// extractAsTSV: function (result) {
//   if (!result) return;

//   const header = ["Profiling Status\tCard Id\tCard Title\tSize\tResolution\tUrl"];
//   const rows = result.map(item => {
//       let bodyAreaArray = [];
//       let expandedAreaArray = [];

//       if (item.profilingStatus) {
//           const { bodyArea, expandedArea, logo } = item.resources;
//           bodyAreaArray = helper.generateTsvRow(item, bodyArea) || [];
//           expandedAreaArray = helper.generateTsvRow(item, expandedArea);

//           bodyAreaArray.unshift(`Y\t${item.cardId}\t${item.cardTitle}\t${logo.size}\t${logo.resolution}\t${logo.src}\t`);
//           return bodyAreaArray.concat(expandedAreaArray).join("\n");
//       } else {
//           return `N ${item.error ? `[${item.error}]` : ''}\t${item.cardId}\t${item.cardTitle ? item.cardTitle : ''}\t\t\t`;
//       }
//   });

//   return header.concat(rows).join("\n");
// }

// generateTsvRow: function (parent, arr) {
//   return arr && arr.map(item => {
//       if (item.hasOwnProperty('error')) {
//           let str = "";

//           if (item.error.hasOwnProperty('msg')) {
//               str = `Y\t${parent.cardId}\t${parent.cardTitle}\t${item.error.status} error\t${item.error.msg}\t${item.src}\t`
//           } else {
//               str = `Y\t${parent.cardId}\t${parent.cardTitle}\t${item.error}\tUnable to get image resolution\t${item.src}\t`
//           }

//           return str;
//       } else {
//           return `Y ${!item.size.isValid ? '[Heavy Resource]' : ''}\t${parent.cardId}\t${parent.cardTitle}\t${item.size.current}\t${item.resolution.current}\t${item.src}`
//       }
//   });
// }

// card id width	height	Fize Size	Url