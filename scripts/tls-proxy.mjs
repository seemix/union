// Local HTTPS front for `next start` so Lighthouse can load v2 the way production serves it
// (the CSP has `upgrade-insecure-requests`, which breaks plain http). Self-signed: Chrome needs
// --ignore-certificate-errors (set in scripts/lighthouse.mjs). Measurement tool only.
//   openssl req -x509 -newkey rsa:2048 -nodes -keyout perf/lh-key.pem -out perf/lh-cert.pem -days 30 \
//     -subj "/CN=ru.baptist.org.md" -addext "subjectAltName=DNS:ru.baptist.org.md,DNS:ro.baptist.org.md"
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';

const UPSTREAM = Number(process.env.LH_V2_PORT ?? 3200);
const PORT = Number(process.env.LH_TLS_PORT ?? 3443);

https
  .createServer({ key: fs.readFileSync('perf/lh-key.pem'), cert: fs.readFileSync('perf/lh-cert.pem') }, (req, res) => {
    const up = http.request({ host: '127.0.0.1', port: UPSTREAM, path: req.url, method: req.method, headers: req.headers }, (r) => {
      res.writeHead(r.statusCode ?? 502, r.headers);
      r.pipe(res);
    });
    up.on('error', () => res.writeHead(502).end());
    req.pipe(up);
  })
  .listen(PORT, '127.0.0.1', () => console.log(`tls-proxy https://127.0.0.1:${PORT} → :${UPSTREAM}`));
