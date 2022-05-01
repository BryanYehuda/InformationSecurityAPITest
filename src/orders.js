import { createHmac } from 'crypto';
import { Agent, request as _request } from 'https';
import { stringify } from 'querystring';

const USER_AGENT = 'BRYAN';
const DEFAULT_ENDPOINT = 'ftx.com';
const DEFAULT_HEADER_PREFIX = 'FTX';

// We are creating a Balance class to accomodate our Request to the FTX's Server
class Orders {
  constructor(setting) {
    this.ua = USER_AGENT;
    this.timeout = 90 * 1000;

    this.agent = new Agent({
      keepAlive: true,
      timeout: 90 * 1000,
      keepAliveMsecs: 1000 * 60,
    });

    if (!setting) {
      return;
    }

    if (setting.key && setting.secret) {
      this.key = setting.key;
      this.secret = setting.secret;
    }

    if (setting.timeout) {
      this.timeout = setting.timeout;
    }

    if (setting.userAgent) {
      this.ua += ` | ${setting.userAgent}`;
    }

    this.endpoint = setting.endpoint || DEFAULT_ENDPOINT;
    this.headerPrefix = setting.headerPrefix || DEFAULT_HEADER_PREFIX;
  }

  // We are creating a draft so that we save time when we are sending our
  // request because we already have a template of what to be sent
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
    let paydata = '';
    if (method === 'GET' && data) {
      path += `?${stringify(data)}`;
    } else if (data) {
      paydata = JSON.stringify(data);
    }

    const start = +new Date();

    const signature = createHmac('sha256', this.secret)
      .update(start + method + path + paydata).digest('hex');

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
      paydata,
    };

    return options;
  }

  // We are sending the request to FTX's server using the specified
  // API Key, Method, and path
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

      req.end(draft.paydata);
    });
  }

  request(props) {
    return this.requestDraft(this.createDraft(props));
  }
}

// The Api Key needed to make a Request to FTX's Server
const ftx = new Orders({
  key: '_njFKoPZrOV_9Tme2-m5vQGP8eCL3nKoJ2GTuuFU',
  secret: '9nHenFZftNXI5vPVcEW62lZtMpqGbhyIExQOaMTU',
});

// The path and method needed to make a Request to FTX's Server
ftx.request({
  method: 'GET',
  path: '/account',
}).then(console.log); // Then we output the results