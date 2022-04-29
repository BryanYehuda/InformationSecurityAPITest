import { createHmac } from 'crypto';
import { Agent, request as _request } from 'https';
import { stringify } from 'querystring';

const USER_AGENT = 'BRYAN';
const DEFAULT_ENDPOINT = 'ftx.com';
const DEFAULT_HEADER_PREFIX = 'FTX';

class FTXRest {
  constructor(config) {
    this.ua = USER_AGENT;
    this.timeout = 90 * 1000;

    this.agent = new Agent({
      keepAlive: true,
      timeout: 90 * 1000,
      keepAliveMsecs: 1000 * 60,
    });

    if (!config) {
      return;
    }

    if (config.key && config.secret) {
      this.key = config.key;
      this.secret = config.secret;
    }

    if (config.timeout) {
      this.timeout = config.timeout;
    }

    if (config.userAgent) {
      this.ua += ` | ${config.userAgent}`;
    }

    this.endpoint = config.endpoint || DEFAULT_ENDPOINT;
    this.headerPrefix = config.headerPrefix || DEFAULT_HEADER_PREFIX;
  }

  createDraft({
    path,
    method,
    data,
    timeout,
  }) {
    if (!timeout) {
      timeout = this.timeout;
    }

    path = `/api${path}`;
    let payload = '';
    if (method === 'GET' && data) {
      path += `?${stringify(data)}`;
    } else if (data) {
      payload = JSON.stringify(data);
    }

    const start = +new Date();

    const signature = createHmac('sha256', this.secret)
      .update(start + method + path + payload).digest('hex');

    const options = {
      host: this.endpoint,
      path,
      method,
      agent: this.agent,
      headers: {
        'User-Agent': this.ua,
        'content-type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        [`${this.headerPrefix}-TS`]: start,
        [`${this.headerPrefix}-KEY`]: this.key,
        [`${this.headerPrefix}-SIGN`]: signature,
      },
      timeout,
      payload,
    };

    return options;
  }

  requestDraft(draft) {
    return new Promise((resolve, reject) => {
      const req = _request(draft, (res) => {
        res.setEncoding('utf8');
        let buffer = '';
        res.on('data', (data) => {
          buffer += data;
        });
        res.on('end', () => {
          if (res.statusCode >= 300) {
            let message;
            let data;

            try {
              data = JSON.parse(buffer);
              message = data;
            } catch (e) {
              message = buffer;
            }

            console.error('ERROR!', res.statusCode, message);
            const error = new Error(message.error);
            error.statusCode = res.statusCode;
            return reject(error);
          }

          let data;
          try {
            data = JSON.parse(buffer);
          } catch (err) {
            console.error('JSON ERROR!', buffer);
            return reject(new Error('Json error'));
          }

          resolve(data);
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('socket', (socket) => {
        if (socket.connecting) {
          socket.setNoDelay(true);
          socket.setTimeout(draft.timeout);
          socket.on('timeout', () => {
            req.abort();
          });
        }
      });

      req.end(draft.payload);
    });
  }

  request(props) {
    return this.requestDraft(this.createDraft(props));
  }
}

const ftx = new FTXRest({
  key: '_njFKoPZrOV_9Tme2-m5vQGP8eCL3nKoJ2GTuuFU',
  secret: '9nHenFZftNXI5vPVcEW62lZtMpqGbhyIExQOaMTU',
});

ftx.request({
  method: 'GET',
  path: '/wallet/balances',
}).then(console.log);