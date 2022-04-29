const time = require('./time');

const API_KEY = '_njFKoPZrOV_9Tme2-m5vQGP8eCL3nKoJ2GTuuFU';
const market = 'XRP-PERP';

const baseUrl = 'https://ftx.com/api';
const balance = `${baseUrl}/wallet/balances`;
const openOrder = `${baseUrl}/orders?market=${market}`;

const fetchApi = (url) => fetch(url, {
    headers: {
        'FTX-KEY': API_KEY,
        'FTX-SIGN': ,
        'FTX-TS': time
    },
});

const status = (response) => {
    if (response.status !== 200) {
        console.log(`Error : ${response.status}`);

        return Promise.reject(new Error(response.statusText));
    }
    return Promise.resolve(response);
};

const json = (response) => response.json();

const error = (error) => {
    console.log(`Error: ${error}`);
};

const getBalance = () => {
    const fetK = fetchApi(balance)
        .then(status)
        .then(json);
    return fetK;
};

const getOrder = () => {
    const fetT = fetchApi(openOrder)
        .then(status)
        .then(json);
    return fetT;
};