// Simple OpenAI key + connectivity test
const https = require('https');

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error('No OPENAI_API_KEY in environment. Set it in .env or export in shell.');
  process.exit(1);
}

function mask(k){
  if (k.length < 12) return '***';
  return k.slice(0,8) + '...' + k.slice(-4);
}
console.log('Using OPENAI_API_KEY =', mask(key));

const postData = JSON.stringify({
  model: 'gpt-3.5-turbo',
  messages: [{role: 'user', content: '안녕'}],
  max_tokens: 10
});

const options = {
  hostname: 'api.openai.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${key}`
  },
  timeout: 10000
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('HTTP', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Non-JSON response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});
req.on('timeout', () => { req.abort(); console.error('Request timed out'); });
req.write(postData);
req.end();
