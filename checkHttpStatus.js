const puppeteer = require('puppeteer');
const fs = require('fs/promises');
const html = process.argv[2];

if (!html) {
  console.log('htmlファイル、もしくは有効なURLを指定してください');
  return;
}
(async () => {
  const browser = await puppeteer.launch({
    headless: true, /* ヘッドレスモードで起動するかどうか。デバッグ段階では false を設定することで動きを目視で確認できる */
    timeout: 10000, /* ブラウザの開始を待つ最長時間(ms)を設定。タイムアウトを無効にする場合 0 を設定*/
  });
  const page = (await browser.pages())[0];

  try {
    if (html.match(/^http/)) {
      await page.goto(html);
    } else {
      const buffer = await fs.readFile(html);
      await page.goto(`data:text/html;base64,${buffer.toString("base64")}`);
    }

    const aTags = await page.$$('a');
    let count400 = 0;
    for (let aTag of aTags) {
      console.log("=================");
      const href = await aTag.getProperty('href');
      const url = await href.jsonValue();
      console.log(`url: ${url}`);

      const newPage = await browser.newPage();
      const response = await newPage.goto(url, { waitUntil: 'domcontentloaded' });
      console.log(`status: ${response.status()}`);

      if (response.status() >= 400) count400++;
      await newPage.close();
    }
    console.log("=================");
    console.log(`処理が完了しました。http status 400番台は「${count400}件」でした`);
    console.log("");
  } catch (err) {
    // エラーが起きた際の処理
    console.log(err);
  } finally {
    await browser.close();
  }
})();
