const { firefox } = require('playwright');

async function getWarrantyInfo(serialNumber) {
    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://pcsupport.lenovo.com/us/en/warrantylookup', {
            waitUntil: 'domcontentloaded'
        });

        await page.waitForSelector('button.button.blue-solid.modal-button-top40.btn_no', { timeout: 10000 });
        await page.click('button.button.blue-solid.modal-button-top40.btn_no');

        await page.waitForSelector('input.button-placeholder__input', { timeout: 10000 });
        await page.fill('input.button-placeholder__input', serialNumber);

        await page.waitForFunction(() => {
            const btn = document.querySelector('button.btn.basic-search__suffix-btn');
            return btn && !btn.disabled;
        }, { timeout: 30000 });

        await page.click('button.btn.basic-search__suffix-btn');
        await page.waitForSelector('div.warranty-sheet__cell', { timeout: 30000 });

        const productName = await page.$eval('div.prod-name h4', el => el.innerText.trim());

        const warrantyDetails = await page.$$eval('div.warranty-sheet__cell', cells => {
            return cells.map(cell => {
                const getText = (selector) => {
                    const el = cell.querySelector(selector);
                    return el ? el.innerText.trim() : null;
                };

                const properties = {};
                cell.querySelectorAll('.detail-property').forEach(prop => {
                    const titleEl = prop.querySelector('.property-title');
                    const valueEl = prop.querySelector('.property-value');
                    if (titleEl && valueEl) {
                        properties[titleEl.innerText.trim()] = valueEl.innerText.trim();
                    }
                });

                return {
                    supportTitle: getText('.detail-title .title-content'),
                    startDate: properties['Start Date'] || null,
                    status: properties['Status'] || null,
                    endDate: properties['End Date'] || null,
                    type: properties['Type'] || null
                };
            }).filter(x => x.supportTitle);
        });

        return { productName, warrantyDetails };

    } finally {
        await browser.close();
    }
}

module.exports = { getWarrantyInfo };
