const http = require('http');

const body = JSON.stringify({
  models: ['llama3.1:8b'],
  prompts: [
    'Explica brevemente qué es el caudal de un río y por qué es importante monitorearlo.',
    'Si el caudal actual es 25 m³/s y se esperan 15mm de lluvia en 24h, ¿cuál es el riesgo de inundación? Explica tu razonamiento.'
  ],
  iterations: 1,
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/experiments/run',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (err) => {
  console.error('ERROR', err.message);
});

req.write(body);
req.end();
