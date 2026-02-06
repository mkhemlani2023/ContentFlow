const http = require('http');
const https = require('https');
const url = require('url');

const RESELLERCLUB_RESELLER_ID = '1313677';
const RESELLERCLUB_API_KEY = 'Viq7T7mtxjp0iR2udU1CoFmgayJEDEG5';
const RESELLERCLUB_BASE_URL = 'https://test.httpapi.com/api';

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    
    // Health check
    if (parsedUrl.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', ip: '157.245.127.106' }));
        return;
    }

    // Proxy ResellerClub API calls
    if (parsedUrl.pathname.startsWith('/api/resellerclub/')) {
        try {
            let body = '';
            for await (const chunk of req) {
                body += chunk;
            }
            const data = body ? JSON.parse(body) : {};
            
            const endpoint = parsedUrl.pathname.replace('/api/resellerclub/', '');
            
            // Route to appropriate ResellerClub endpoint
            let apiUrl;
            let method = 'GET';
            
            if (endpoint === 'check-availability') {
                const params = new URLSearchParams({
                    'auth-userid': RESELLERCLUB_RESELLER_ID,
                    'api-key': RESELLERCLUB_API_KEY,
                    'domain-name': data.domain_name
                });
                (data.tlds || ['com']).forEach(tld => params.append('tlds', tld));
                apiUrl = `${RESELLERCLUB_BASE_URL}/domains/available.json?${params}`;
            } else if (endpoint === 'pricing') {
                const params = new URLSearchParams({
                    'auth-userid': RESELLERCLUB_RESELLER_ID,
                    'api-key': RESELLERCLUB_API_KEY,
                    'product-key': 'domcno'
                });
                apiUrl = `${RESELLERCLUB_BASE_URL}/products/customer-price.json?${params}`;
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Unknown endpoint' }));
                return;
            }

            // Make request to ResellerClub
            const proxyRes = await new Promise((resolve, reject) => {
                https.get(apiUrl, (response) => {
                    let data = '';
                    response.on('data', chunk => data += chunk);
                    response.on('end', () => resolve({ status: response.statusCode, data }));
                }).on('error', reject);
            });

            res.writeHead(proxyRes.status, { 'Content-Type': 'application/json' });
            
            // Parse and transform response
            const rcData = JSON.parse(proxyRes.data);
            const results = {};
            for (const [key, value] of Object.entries(rcData)) {
                if (typeof value === 'object' && value.status) {
                    results[key] = {
                        available: value.status === 'available',
                        status: value.status
                    };
                }
            }
            
            res.end(JSON.stringify({ success: true, results, sandbox: true }));
            
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(8889, '0.0.0.0', () => {
    console.log('ResellerClub proxy running on port 8889');
});
