import CryptoJS from 'crypto-js';
import moment from 'moment';

const API_SECRET = '9nHenFZftNXI5vPVcEW62lZtMpqGbhyIExQOaMTU';
const baseUrl = 'https://ftx.com/api';
const market = 'XRP-PERP';
const balance = `${baseUrl}/wallet/balances`;
const openOrder = `${baseUrl}/orders?market=${market}`;

const hmacBalance = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, API_SECRET);
hmacBalance.update(String(moment().format()));
hmacBalance.update('GET');
hmacBalance.update(balance);

const hashBalance = hmacBalance.finalize();
const hashBalanceString = hashBalance.toString(CryptoJS.enc.Hex);
console.log(hashBalanceString);

const hmacOrder = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, API_SECRET);
hmacOrder.update(String(new Date().getTime()));
hmacOrder.update('GET');
hmacOrder.update(openOrder);

const hashOrder = hmacBalance.finalize();
const hashOrderString = hashOrder.toString(CryptoJS.enc.Hex);

export { hashBalanceString, hashOrderString };