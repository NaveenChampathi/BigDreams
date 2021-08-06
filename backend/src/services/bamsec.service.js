const axios = require('axios');
const puppeteer = require('puppeteer');

const BAMSEC_ROOT = 'https://www.bamsec.com';
const BAMSEC_AUTOCOMPLETE_PATH = BAMSEC_ROOT + '/entity-search/autocomplete?q=';

const getCompanyHomeURL = async (ticker) => {
    return axios.get(`${BAMSEC_AUTOCOMPLETE_PATH}${ticker}`).then(async ({data}) => {
        // console.log(data);
        const { url } = data[0];

        const browser = await puppeteer.launch({args: ["--no-sandbox"]});
        const page = await browser.newPage();

        await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3205.0 Safari/537.36");
        await page.setRequestInterception(true);

        page.on('request', (request) => {

            if ((request.resourceType() === 'image') || (request.resourceType() === 'stylesheet')
                || (request.resourceType() === 'font') || (request.resourceType() === 'media')) {
                //console.log("BLOCK: " + request.resourceType() + "@" + request.url());
                request.abort();
            }
            else if ((request.resourceType() === 'script') || (request.resourceType() === 'xhr')) {
                if (request.url().search(/:\/\/.*bamsec\.com\//) !== -1) {
                    //console.log("ALLOW: " + request.resourceType() + "@" + request.url());
                    request.continue();
                }
                else {
                    //console.log("BLOCK: " + request.resourceType() + "@" + request.url());
                    request.abort();
                }
            }
            else if (request.resourceType() === 'document') {
                //console.log("ALLOW: " + request.resourceType() + "@" + request.url());
                request.continue();
            }
            else {
                //console.log("BLOCK: " + request.resourceType() + "@" + request.url());
                request.abort();
            }
        });

        //page.on('console', msg => console.log('PAGE_LOG:', msg.text));

        try {
            const rsp = await page.goto(`${BAMSEC_ROOT}${url}`);

            const selector = '.company-content';

            await page.waitForSelector(selector, { timeout: 9000 });

            let pageData = await page.evaluate(function(ticker) {

                // Financials
                let financials = document.getElementById("financial");
                let financialFilings = financials.getElementsByClassName("default-results");

                const financialFilingsData = financialFilings[0].getElementsByTagName("a");
                const financialFilingsResults = [];
                
                for (var jdx = 0; jdx < financialFilingsData.length; jdx++) {
                    const filing = financialFilingsData[jdx];
                    const filingUrl = filing.getAttribute("href");
                    const title = filing.getAttribute("title");

                    const filingType = filing.getElementsByClassName("label-left")[0].innerText;
                    const filingDate = filing.getElementsByClassName("label-right")[0].innerText;

                    financialFilingsResults.push({
                        filingType,
                        filingDate,
                        filingUrl,
                        title
                    });
                }

                // News
                let news = document.getElementById("news");
                let newsFilings = news.getElementsByClassName("default-results");

                const newsFilingsData = newsFilings[0].getElementsByTagName("a");
                const newsFilingsResults = [];
                
                for (var jdx = 0; jdx < newsFilingsData.length; jdx++) {
                    const filing = newsFilingsData[jdx];
                    const filingUrl = filing.getAttribute("href");
                    const title = filing.getAttribute("title");

                    const filingType = filing.getElementsByClassName("label-left")[0].innerText;
                    const filingDate = filing.getElementsByClassName("label-right")[0].innerText;

                    newsFilingsResults.push({
                        filingType,
                        filingDate,
                        filingUrl,
                        title
                    });
                }

                // Registration and Prospectuses
                let registrations = document.getElementById("registrations");
                let registrationsFilings = registrations.getElementsByClassName("default-results");

                const registrationsFilingsData = registrationsFilings[0].getElementsByTagName("a");
                const registrationsFilingsResults = [];
                
                for (var jdx = 0; jdx < registrationsFilingsData.length; jdx++) {
                    const filing = registrationsFilingsData[jdx];
                    const filingUrl = filing.getAttribute("href");
                    const title = filing.getAttribute("title");

                    const filingType = filing.getElementsByClassName("label-left")[0].innerText;
                    const filingDate = filing.getElementsByClassName("label-right")[0].innerText;

                    registrationsFilingsResults.push({
                        filingType,
                        filingDate,
                        filingUrl,
                        title
                    });
                }

                // Other
                let other = document.getElementById("other");
                let otherFilings = other.getElementsByClassName("default-results");

                const otherFilingsData = otherFilings[0].getElementsByTagName("a");
                const otherFilingsResults = [];
                
                for (var jdx = 0; jdx < otherFilingsData.length; jdx++) {
                    const filing = otherFilingsData[jdx];
                    const filingUrl = filing.getAttribute("href");
                    const title = filing.getAttribute("title");

                    const filingType = filing.getElementsByClassName("label-left")[0].innerText;
                    const filingDate = filing.getElementsByClassName("label-right")[0].innerText;

                    otherFilingsResults.push({
                        filingType,
                        filingDate,
                        filingUrl,
                        title
                    });
                }

                return {
                    financialFilingsResults,
                    newsFilingsResults,
                    registrationsFilingsResults,
                    otherFilingsResults
                };
            }, ticker);

            return pageData;

        }
        catch (err) {
            console.error(err.stack ? err.stack : err)
        }

        browser.close();
        throw new Error(`unable to fetch data for ${symbol}`);
    });
} 

module.exports = {
    getCompanyHomeURL
}