const puppeteer = require('puppeteer');
const config = require('./config');
const util = require('./utils');

class App {
  constructor(options = {}) {
    this.options = options;
    this.providers = [];
    this.entities = [];
  }
  provider(provider) {
    this.providers.push(provider);
    return this;
  }
  async run() {
    const entities = this.entities;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];

      try {
        await this.page.goto(entity.url, {
          networkIdleTimeout: 5000,
          waitUntil: 'networkidle',
          timeout: 3000000
        });

        await this.page.deleteCookie();

        await entity.resolve(this);
      } catch (err) {
        console.error(err);
      } finally {
        await util.sleep(2000);
      }
    }
  }
  async bootstrap(options = {}) {
    const browser = (this.browser = await puppeteer.launch({
      headless: config.isProduction
    }));
    const page = (this.page = await browser.newPage());
    const providers = this.providers;

    while (providers.length) {
      const Provider = providers.shift();
      this.entities.push(new Provider());
    }

    console.info(`Bootstrap done!`);

    if (this.options.once === true) {
      await this.run();
    } else {
      while (true) {
        await this.run();
        await util.sleep(1000 * 60);
      }
    }

    if (options.autoClose === true) {
      await page.close();
      await browser.close();
    }
  }
}

module.exports = App;
