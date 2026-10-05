const baseUrl = (process.argv[2] || process.env.RF_PUBLIC_URL || 'https://demo.wizmonk.com/rf').replace(/\/+$/, '');
const sampleMedia = process.argv[3] || process.env.RF_SAMPLE_MEDIA || 'media/15e9acf9-cc82-4a7e-8713-063b0b925c51.webp';

const checks = [
  {
    name: 'Frontend shell',
    url: `${baseUrl}/`,
    expect: ({ status, contentType, body }) => status === 200 && contentType.includes('text/html') && body.includes('Research Factors')
  },
  {
    name: 'Health ready through PHP gateway',
    url: `${baseUrl}/health/ready`,
    expect: ({ status, contentType, body }) => status === 200 && contentType.includes('application/json') && body.includes('"status":"ready"')
  },
  {
    name: 'API base through PHP gateway',
    url: `${baseUrl}/api/v1`,
    expect: ({ status, contentType, body }) => status === 200 && contentType.includes('application/json') && body.includes('Research Factors API v1')
  },
  {
    name: 'Published articles API',
    url: `${baseUrl}/api/v1/articles?limit=1`,
    expect: ({ status, contentType }) => status === 200 && contentType.includes('application/json')
  },
  {
    name: 'Existing local media',
    url: `${baseUrl}/uploads/${sampleMedia.replace(/^\/?uploads\/?/, '').replace(/^\/+/, '')}`,
    expect: ({ status, contentType, bytes }) => status === 200 && contentType.startsWith('image/') && bytes > 0
  },
  {
    name: 'Protected auth check',
    url: `${baseUrl}/api/v1/auth/me`,
    expect: ({ status, contentType }) => [401, 403].includes(status) && contentType.includes('application/json')
  }
];

async function runCheck(check) {
  const response = await fetch(check.url, { redirect: 'manual' });
  const contentType = response.headers.get('content-type') || '';
  const buffer = Buffer.from(await response.arrayBuffer());
  const body = buffer.toString('utf8');
  const result = {
    status: response.status,
    contentType,
    bytes: buffer.length,
    body
  };
  const passed = check.expect(result);
  return { ...check, ...result, passed };
}

let failures = 0;

for (const check of checks) {
  try {
    const result = await runCheck(check);
    if (result.passed) {
      console.log(`PASS ${result.name} (${result.status}, ${result.bytes} bytes)`);
    } else {
      failures += 1;
      console.error(`FAIL ${result.name}`);
      console.error(`  URL: ${result.url}`);
      console.error(`  Status: ${result.status}`);
      console.error(`  Content-Type: ${result.contentType}`);
      console.error(`  Body preview: ${result.body.slice(0, 160).replace(/\s+/g, ' ')}`);
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${check.name}`);
    console.error(`  URL: ${check.url}`);
    console.error(`  Error: ${error.message}`);
  }
}

if (failures > 0) {
  console.error(`Production smoke test failed: ${failures} check(s) failed.`);
  process.exit(1);
}

console.log(`Production smoke test passed for ${baseUrl}`);
