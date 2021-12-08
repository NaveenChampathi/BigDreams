const fetch = require('node-fetch');

fetch('https://api.dilutiontracker.com/v1/getFloat?ticker=ADIL', {
  headers: {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'if-none-match': 'W/"25-SDpGo3RrvXiuQpGPkdrWBbBhbcs"',
    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    url: 'https://dilutiontracker.com/app/search/ADIL',
    'x-referer': '',
    cookie:
      '__stripe_mid=c64a4c5f-a0d9-4f27-bda4-a33864f3b7ba64020e; _hjid=d5d0fcea-7106-449a-b73a-47d8ffb6a20b; intercom-id-qkbpyl27=d25f2305-04c1-4410-bf38-269884b8034f; connect.sid=s%3AjN3XH4v4UkM6ajP5hTIHqtbSMNuvys7U.1Gl1mHnSCxDCLPrnxRWaihpwFud2W%2BHaylBNk3Sj%2F%2Bc; _hjSessionUser_2621496=eyJpZCI6IjcyMmZlNDgwLTdjMmItNWUyZS04NDljLTU2MGViMzE2MTg2NiIsImNyZWF0ZWQiOjE2Mzc3ODI1NTI3MTUsImV4aXN0aW5nIjp0cnVlfQ==; _hjSession_2621496=eyJpZCI6ImEwYzExN2RjLWJjY2MtNDNhOC05OTIwLWRlYTY2NjFiZmViNiIsImNyZWF0ZWQiOjE2MzgyMjUwMDgyODR9; _hjAbsoluteSessionInProgress=0; __stripe_sid=8e58fd4f-df59-455b-aafc-47af6bb7de5213bd21; intercom-session-qkbpyl27=YkRuaGZ4R2NYKzFaU245cWVLQk1zNGZLL1l5ZXF0ZHJZWVhONEs0NnhudkZibWF2dnNycFpIYzYzN25hcmR5Ti0tMjVQYlBlR2UxZG00TmVac0tFKzlpQT09--ce21e14a1c169d96bccfe48ae7d7690d7a4b16f9',
    Referer: 'https://dilutiontracker.com/',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
  body: null,
  method: 'GET',
})
  .then((res) => res.json())
  .then((json) => console.log(json))
  .catch((json) => console.log(json));
