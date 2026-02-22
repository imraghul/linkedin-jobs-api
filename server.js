const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const linkedIn = require('./index');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: 'File not found' });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function normalizeQuery(body) {
  const normalized = {
    keyword: String(body.keyword || '').trim(),
    location: String(body.location || '').trim(),
    dateSincePosted: String(body.dateSincePosted || '').trim(),
    jobType: String(body.jobType || '').trim(),
    remoteFilter: String(body.remoteFilter || '').trim(),
    salary: String(body.salary || '').trim(),
    experienceLevel: String(body.experienceLevel || '').trim(),
    limit: String(body.limit || '25').trim(),
    sortBy: String(body.sortBy || 'recent').trim(),
    page: String(body.page || '0').trim(),
    has_verification: Boolean(body.has_verification),
    under_10_applicants: Boolean(body.under_10_applicants),
  };

  return normalized;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (_err) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    sendFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/styles.css') {
    sendFile(res, path.join(PUBLIC_DIR, 'styles.css'), 'text/css; charset=utf-8');
    return;
  }

  if (req.method === 'GET' && url.pathname === '/app.js') {
    sendFile(res, path.join(PUBLIC_DIR, 'app.js'), 'application/javascript; charset=utf-8');
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/search') {
    try {
      const body = await readBody(req);
      const queryOptions = normalizeQuery(body);
      const jobs = await linkedIn.query(queryOptions);
      sendJson(res, 200, {
        query: queryOptions,
        count: jobs.length,
        jobs,
      });
    } catch (error) {
      sendJson(res, 400, {
        error: error.message || 'Failed to fetch jobs',
      });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Local jobs UI running at http://localhost:${PORT}`);
});
