import 'reflect-metadata';
import { performance } from 'perf_hooks';
import http from 'http';
import Fastify from 'fastify';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { RiktaFactory } from '@riktajs/core';
import { RequestUserService, RequestUserController } from './fixtures/request.fixture';
import { NestRequestUserModule } from './fixtures/nestjs-request.fixture';

// ===== HTTP Client Helper =====

function httpRequest(options: http.RequestOptions, body?: any): Promise<{ statusCode: number; data: any; time: number }> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const time = performance.now() - start;
        resolve({
          statusCode: res.statusCode || 0,
          data: data ? JSON.parse(data) : null,
          time
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ===== Interleaved Benchmark Functions =====

async function benchmarkGetInterleaved(
  fastifyPort: number,
  riktaPort: number,
  nestPort: number,
  requests: number = 1000
): Promise<{ fastify: number[]; rikta: number[]; nest: number[]; errors: { f: number; r: number; n: number } }> {
  const fastify: number[] = [];
  const rikta: number[] = [];
  const nest: number[] = [];
  const errors = { f: 0, r: 0, n: 0 };

  for (let i = 0; i < requests; i++) {
    try {
      const f = await httpRequest({ hostname: '127.0.0.1', port: fastifyPort, path: '/api/users', method: 'GET' });
      fastify.push(f.time);
    } catch { errors.f++; }

    try {
      const r = await httpRequest({ hostname: '127.0.0.1', port: riktaPort, path: '/api/users', method: 'GET' });
      rikta.push(r.time);
    } catch { errors.r++; }

    try {
      const n = await httpRequest({ hostname: '127.0.0.1', port: nestPort, path: '/api/users', method: 'GET' });
      nest.push(n.time);
    } catch { errors.n++; }
  }

  return { fastify, rikta, nest, errors };
}

async function benchmarkPostInterleaved(
  fastifyPort: number,
  riktaPort: number,
  nestPort: number,
  requests: number = 500
): Promise<{ fastify: number[]; rikta: number[]; nest: number[]; errors: { f: number; r: number; n: number } }> {
  const fastify: number[] = [];
  const rikta: number[] = [];
  const nest: number[] = [];
  const errors = { f: 0, r: 0, n: 0 };

  for (let i = 0; i < requests; i++) {
    const body = { name: `User ${i}`, email: `user${i}@example.com` };
    const options = (port: number) => ({
      hostname: '127.0.0.1',
      port,
      path: '/api/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    try {
      const f = await httpRequest(options(fastifyPort), body);
      fastify.push(f.time);
    } catch { errors.f++; }

    try {
      const r = await httpRequest(options(riktaPort), body);
      rikta.push(r.time);
    } catch { errors.r++; }

    try {
      const n = await httpRequest(options(nestPort), body);
      nest.push(n.time);
    } catch { errors.n++; }
  }

  return { fastify, rikta, nest, errors };
}

async function benchmarkParamInterleaved(
  fastifyPort: number,
  riktaPort: number,
  nestPort: number,
  requests: number = 1000
): Promise<{ fastify: number[]; rikta: number[]; nest: number[]; errors: { f: number; r: number; n: number } }> {
  const fastify: number[] = [];
  const rikta: number[] = [];
  const nest: number[] = [];
  const errors = { f: 0, r: 0, n: 0 };

  for (let i = 0; i < requests; i++) {
    try {
      const f = await httpRequest({ hostname: '127.0.0.1', port: fastifyPort, path: '/api/users/123', method: 'GET' });
      fastify.push(f.time);
    } catch { errors.f++; }

    try {
      const r = await httpRequest({ hostname: '127.0.0.1', port: riktaPort, path: '/api/users/123', method: 'GET' });
      rikta.push(r.time);
    } catch { errors.r++; }

    try {
      const n = await httpRequest({ hostname: '127.0.0.1', port: nestPort, path: '/api/users/123', method: 'GET' });
      nest.push(n.time);
    } catch { errors.n++; }
  }

  return { fastify, rikta, nest, errors };
}

// ===== Statistics =====

function calculateStats(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const mean = sum / times.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  return { mean, min, max, median, p95, p99 };
}

function formatTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  }
  return `${ms.toFixed(2)}ms`;
}

function displayResults(
  title: string,
  fastifyStats: any,
  riktaStats: any,
  nestStats: any,
  errors: { f: number; r: number; n: number }
) {
  console.log(`\n╔═══════════════════════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║ ${title.padEnd(93)} ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════════════════════════════════╣');
  console.log('║ Metric    │  Fastify        │  Rikta          │  NestJS         │ R vs F   │ R vs N   ║');
  console.log('╟───────────┼─────────────────┼─────────────────┼─────────────────┼──────────┼──────────╢');
  
  const metrics = [
    ['Mean', fastifyStats.mean, riktaStats.mean, nestStats.mean],
    ['Median', fastifyStats.median, riktaStats.median, nestStats.median],
    ['Min', fastifyStats.min, riktaStats.min, nestStats.min],
    ['Max', fastifyStats.max, riktaStats.max, nestStats.max],
    ['P95', fastifyStats.p95, riktaStats.p95, nestStats.p95],
    ['P99', fastifyStats.p99, riktaStats.p99, nestStats.p99],
  ];

  metrics.forEach(([name, fastify, rikta, nest]) => {
    const riktaVsFastify = ((rikta - fastify) / fastify * 100).toFixed(1);
    const riktaVsNest = ((rikta - nest) / nest * 100).toFixed(1);
    const riktaVsFastifyStr = riktaVsFastify.startsWith('-') ? `${riktaVsFastify}%` : `+${riktaVsFastify}%`;
    const riktaVsNestStr = riktaVsNest.startsWith('-') ? `${riktaVsNest}%` : `+${riktaVsNest}%`;
    console.log(`║ ${String(name).padEnd(9)} │ ${formatTime(fastify).padEnd(15)} │ ${formatTime(rikta).padEnd(15)} │ ${formatTime(nest).padEnd(15)} │ ${riktaVsFastifyStr.padStart(8)} │ ${riktaVsNestStr.padStart(8)} ║`);
  });

  console.log('╟───────────┼─────────────────┼─────────────────┼─────────────────┼──────────┼──────────╢');
  console.log(`║ Errors    │ ${String(errors.f).padEnd(15)} │ ${String(errors.r).padEnd(15)} │ ${String(errors.n).padEnd(15)} │          │          ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════════╝');
}

// ===== Main Benchmark =====

async function runBenchmark() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║    REQUEST OVERHEAD BENCHMARK (INTERLEAVED) - Fair Comparison            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Methodology: Interleaved requests (F-R-N-F-R-N) to eliminate ordering bias\n');

  const getRequests = 1000;
  const postRequests = 500;
  const paramRequests = 1000;

  // Setup Fastify
  console.log('⚙️  Setting up Fastify...');
  const fastifyApp = Fastify({ 
    logger: false,
    disableRequestLogging: true,
    bodyLimit: 1048576
  });
  
  const fastifyUserService = {
    users: [] as any[],
    getAll() { return this.users; },
    getById(id: string) { return { id, name: `User ${id}`, email: `user${id}@test.com` }; },
    create(data: any) {
      const user = { id: Date.now().toString(), ...data };
      this.users.push(user);
      return user;
    }
  };
  
  fastifyApp.get('/api/users', async () => fastifyUserService.getAll());
  fastifyApp.get('/api/users/:id', async (req: any) => fastifyUserService.getById(req.params.id));
  fastifyApp.post('/api/users', async (req: any) => fastifyUserService.create(req.body));

  await fastifyApp.listen({ port: 0, host: '127.0.0.1' });
  const fastifyPort = (fastifyApp.server.address() as any).port;
  console.log(`✓ Fastify listening on port ${fastifyPort}`);

  // Setup Rikta
  console.log('⚙️  Setting up Rikta...');
  const riktaApp = await RiktaFactory.create({
    port: 0,
    autowired: false,
    silent: true,
    logger: false,
    controllers: [RequestUserController],
    providers: [RequestUserService]
  });
  
  const riktaAddress = await riktaApp.listen();
  const riktaPort = parseInt(new URL(riktaAddress).port);
  console.log(`✓ Rikta listening on port ${riktaPort}`);

  // Setup NestJS
  console.log('⚙️  Setting up NestJS...');
  const nestApp = await NestFactory.create(
    NestRequestUserModule,
    new FastifyAdapter(),
    { logger: false }
  );
  await nestApp.listen(0, '127.0.0.1');
  const nestPort = (nestApp.getHttpAdapter().getInstance().server.address() as any).port;
  console.log(`✓ NestJS listening on port ${nestPort}\n`);

  // Warm-up with interleaved requests
  console.log('⏳ Warming up (200 interleaved requests)...');
  await benchmarkGetInterleaved(fastifyPort, riktaPort, nestPort, 200);
  console.log('✓ Warm-up completed\n');

  // ===== GET Requests Benchmark =====
  console.log(`📊 Benchmarking GET requests (${getRequests} interleaved requests)...`);
  
  const getResult = await benchmarkGetInterleaved(fastifyPort, riktaPort, nestPort, getRequests);
  const fastifyGetStats = calculateStats(getResult.fastify);
  const riktaGetStats = calculateStats(getResult.rikta);
  const nestGetStats = calculateStats(getResult.nest);
  console.log('  ✓ Completed');

  displayResults('GET /api/users (INTERLEAVED)', fastifyGetStats, riktaGetStats, nestGetStats, getResult.errors);

  // ===== POST Requests Benchmark =====
  console.log(`\n📊 Benchmarking POST requests (${postRequests} interleaved requests)...`);
  
  const postResult = await benchmarkPostInterleaved(fastifyPort, riktaPort, nestPort, postRequests);
  const fastifyPostStats = calculateStats(postResult.fastify);
  const riktaPostStats = calculateStats(postResult.rikta);
  const nestPostStats = calculateStats(postResult.nest);
  console.log('  ✓ Completed');

  displayResults('POST /api/users (INTERLEAVED)', fastifyPostStats, riktaPostStats, nestPostStats, postResult.errors);

  // ===== Param Requests Benchmark =====
  console.log(`\n📊 Benchmarking Param requests (${paramRequests} interleaved requests)...`);
  
  const paramResult = await benchmarkParamInterleaved(fastifyPort, riktaPort, nestPort, paramRequests);
  const fastifyParamStats = calculateStats(paramResult.fastify);
  const riktaParamStats = calculateStats(paramResult.rikta);
  const nestParamStats = calculateStats(paramResult.nest);
  console.log('  ✓ Completed');

  displayResults('GET /api/users/:id (INTERLEAVED)', fastifyParamStats, riktaParamStats, nestParamStats, paramResult.errors);

  // ===== Summary =====
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            SUMMARY                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  const riktaVsFastifyOverhead = [
    (riktaGetStats.mean - fastifyGetStats.mean) / fastifyGetStats.mean * 100,
    (riktaPostStats.mean - fastifyPostStats.mean) / fastifyPostStats.mean * 100,
    (riktaParamStats.mean - fastifyParamStats.mean) / fastifyParamStats.mean * 100
  ];
  const riktaAvgOverhead = (riktaVsFastifyOverhead.reduce((a, b) => a + b) / riktaVsFastifyOverhead.length).toFixed(1);

  const riktaVsNestImprovement = [
    (riktaGetStats.mean - nestGetStats.mean) / nestGetStats.mean * 100,
    (riktaPostStats.mean - nestPostStats.mean) / nestPostStats.mean * 100,
    (riktaParamStats.mean - nestParamStats.mean) / nestParamStats.mean * 100
  ];
  const riktaAvgImprovement = (riktaVsNestImprovement.reduce((a, b) => a + b) / riktaVsNestImprovement.length).toFixed(1);

  console.log(`📊 Rikta vs Fastify (overhead):`);
  console.log(`   Average: ${riktaAvgOverhead}% ${parseFloat(riktaAvgOverhead) > 0 ? '(expected overhead)' : '(equivalent)'}`);
  console.log(`     • GET:   ${riktaVsFastifyOverhead[0].toFixed(1)}%`);
  console.log(`     • POST:  ${riktaVsFastifyOverhead[1].toFixed(1)}%`);
  console.log(`     • Param: ${riktaVsFastifyOverhead[2].toFixed(1)}%`);
  
  console.log(`\n🆚 Rikta vs NestJS:`);
  console.log(`   Average: ${riktaAvgImprovement}% (Rikta is faster)`);
  console.log(`     • GET:   ${riktaVsNestImprovement[0].toFixed(1)}%`);
  console.log(`     • POST:  ${riktaVsNestImprovement[1].toFixed(1)}%`);
  console.log(`     • Param: ${riktaVsNestImprovement[2].toFixed(1)}%`);

  const totalErrors = getResult.errors.f + getResult.errors.r + getResult.errors.n +
                      postResult.errors.f + postResult.errors.r + postResult.errors.n +
                      paramResult.errors.f + paramResult.errors.r + paramResult.errors.n;

  console.log(`\n✅ Total requests: ${(getRequests + postRequests + paramRequests) * 3}`);
  console.log(`❌ Total errors: ${totalErrors}`);

  console.log('\n📋 INTERPRETATION:');
  if (parseFloat(riktaAvgOverhead) >= -5 && parseFloat(riktaAvgOverhead) <= 10) {
    console.log('   ✅ Rikta overhead vs Fastify is minimal (expected: 2-5%)');
    console.log('   ✅ This is expected since Rikta wraps Fastify with DI + decorators');
  }
  if (parseFloat(riktaAvgImprovement) < -30) {
    console.log(`   ✅ Rikta is ~${Math.abs(parseFloat(riktaAvgImprovement)).toFixed(0)}% faster than NestJS`);
  }

  // Cleanup
  await fastifyApp.close();
  await riktaApp.close();
  await nestApp.close();

  console.log('\n🏁 Benchmark completed!\n');
}

// Run
runBenchmark().catch(console.error);
