import 'reflect-metadata';
import { performance } from 'perf_hooks';
import http from 'http';
import Fastify from 'fastify';
import { RiktaFactory } from '@riktajs/core';
import { RequestUserService, RequestUserController } from './fixtures/request.fixture';

function httpRequest(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.request({ hostname: '127.0.0.1', port, path: '/api/users', method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(performance.now() - start));
    });
    req.on('error', reject);
    req.end();
  });
}

function calcStats(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Calculate standard deviation
  const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  return { 
    mean: mean * 1000, 
    median: median * 1000, 
    stdDev: stdDev * 1000,
    min: sorted[0] * 1000,
    max: sorted[sorted.length - 1] * 1000
  };
}

async function runRound(fastifyPort: number, riktaPort: number, requests: number): Promise<{f: number[], r: number[]}> {
  const fastifyTimes: number[] = [];
  const riktaTimes: number[] = [];

  for (let i = 0; i < requests; i++) {
    fastifyTimes.push(await httpRequest(fastifyPort));
    riktaTimes.push(await httpRequest(riktaPort));
  }

  return { f: fastifyTimes, r: riktaTimes };
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║           STATISTICAL VALIDATION - Fastify vs Rikta Only                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  // Setup Fastify con ESATTAMENTE la stessa logica di Rikta
  const fastifyApp = Fastify({ logger: false });
  
  // Simuliamo la stessa struttura service/controller
  const userService = {
    users: [] as any[],
    getAll() { return this.users; }
  };
  
  const userController = {
    service: userService,
    getAll() { return this.service.getAll(); }
  };
  
  // Handler Fastify che chiama il controller (come fa Rikta)
  fastifyApp.get('/api/users', async () => {
    return userController.getAll();
  });
  
  await fastifyApp.listen({ port: 0, host: '127.0.0.1' });
  const fastifyPort = (fastifyApp.server.address() as any).port;
  console.log(`✓ Fastify on port ${fastifyPort}`);

  // Rikta
  const riktaApp = await RiktaFactory.create({
    port: 0,
    autowired: false,
    silent: true,
    logger: false,
    controllers: [RequestUserController],
    providers: [RequestUserService]
  });
  const riktaPort = parseInt(new URL(await riktaApp.listen()).port);
  console.log(`✓ Rikta on port ${riktaPort}\n`);

  // Warmup lungo
  console.log('⏳ Warming up (500 requests each)...');
  for (let i = 0; i < 500; i++) {
    await httpRequest(fastifyPort);
    await httpRequest(riktaPort);
  }
  console.log('✓ Warm-up completed\n');

  // Multiple rounds
  const ROUNDS = 5;
  const REQUESTS_PER_ROUND = 1000;

  const allFastifyMeans: number[] = [];
  const allRiktaMeans: number[] = [];

  console.log(`📊 Running ${ROUNDS} rounds of ${REQUESTS_PER_ROUND} interleaved requests...\n`);

  for (let round = 1; round <= ROUNDS; round++) {
    const { f, r } = await runRound(fastifyPort, riktaPort, REQUESTS_PER_ROUND);
    const fStats = calcStats(f);
    const rStats = calcStats(r);
    
    allFastifyMeans.push(fStats.mean);
    allRiktaMeans.push(rStats.mean);
    
    const diff = ((rStats.mean - fStats.mean) / fStats.mean * 100).toFixed(2);
    console.log(`Round ${round}: Fastify=${fStats.mean.toFixed(2)}μs, Rikta=${rStats.mean.toFixed(2)}μs (${diff}%)`);
  }

  console.log('\n' + '═'.repeat(70));
  
  const avgFastify = allFastifyMeans.reduce((a, b) => a + b) / allFastifyMeans.length;
  const avgRikta = allRiktaMeans.reduce((a, b) => a + b) / allRiktaMeans.length;
  const overallDiff = ((avgRikta - avgFastify) / avgFastify * 100).toFixed(2);
  
  console.log(`\n📋 MEDIA SU ${ROUNDS} ROUNDS:`);
  console.log(`   Fastify: ${avgFastify.toFixed(2)}μs`);
  console.log(`   Rikta:   ${avgRikta.toFixed(2)}μs`);
  console.log(`   Differenza: ${overallDiff}%`);
  
  // Standard error
  const fastifyVariance = allFastifyMeans.reduce((sum, m) => sum + Math.pow(m - avgFastify, 2), 0) / (ROUNDS - 1);
  const riktaVariance = allRiktaMeans.reduce((sum, m) => sum + Math.pow(m - avgRikta, 2), 0) / (ROUNDS - 1);
  const fastifyStdErr = Math.sqrt(fastifyVariance / ROUNDS);
  const riktaStdErr = Math.sqrt(riktaVariance / ROUNDS);
  
  console.log(`\n📈 VARIABILITÀ (±1 SE):`);
  console.log(`   Fastify: ${avgFastify.toFixed(2)} ± ${fastifyStdErr.toFixed(2)}μs`);
  console.log(`   Rikta:   ${avgRikta.toFixed(2)} ± ${riktaStdErr.toFixed(2)}μs`);

  // T-test approssimativo
  const pooledSE = Math.sqrt(fastifyStdErr**2 + riktaStdErr**2);
  const tStat = Math.abs(avgRikta - avgFastify) / pooledSE;
  
  console.log(`\n🔬 SIGNIFICATIVITÀ STATISTICA:`);
  console.log(`   Differenza assoluta: ${Math.abs(avgRikta - avgFastify).toFixed(2)}μs`);
  console.log(`   Errore standard pooled: ${pooledSE.toFixed(2)}μs`);
  console.log(`   t-statistic: ${tStat.toFixed(2)}`);
  
  if (tStat < 2) {
    console.log(`   ⚠️  Differenza NON statisticamente significativa (t < 2)`);
    console.log(`   → Le performance sono EQUIVALENTI (entro margine di errore)`);
  } else {
    console.log(`   ✅ Differenza statisticamente significativa (t > 2)`);
    if (parseFloat(overallDiff) > 0) {
      console.log(`   → Rikta ha overhead di ~${overallDiff}% rispetto a Fastify`);
    } else {
      console.log(`   → ANOMALIA: Rikta sembra più veloce (verificare il test)`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('\n🎯 CONCLUSIONE:');
  
  const absOverhead = Math.abs(parseFloat(overallDiff));
  if (absOverhead < 5) {
    console.log('   Rikta aggiunge overhead MINIMO (<5%) rispetto a Fastify vanilla.');
    console.log('   Questo è un risultato eccellente per un framework con DI + decorators.');
  } else if (absOverhead < 15) {
    console.log(`   Rikta aggiunge overhead MODERATO (~${absOverhead.toFixed(0)}%) rispetto a Fastify vanilla.`);
  } else {
    console.log(`   Rikta aggiunge overhead SIGNIFICATIVO (~${absOverhead.toFixed(0)}%) rispetto a Fastify vanilla.`);
  }

  await fastifyApp.close();
  await riktaApp.close();
  
  console.log('\n🏁 Done!');
}

main().catch(console.error);
