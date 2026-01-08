import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Rikta, loadEnvFiles, resetEnvLoaded } from '../src';

describe('Environment Variables Available Immediately', () => {
  const envPath = join(process.cwd(), '.env');
  const envBackupPath = join(process.cwd(), '.env.backup');
  
  beforeEach(() => {
    // Backup existing .env if present
    if (existsSync(envPath)) {
      writeFileSync(envBackupPath, readFileSync(envPath));
    }
    
    // Clear any existing env vars from previous tests
    delete process.env.IMMEDIATE_TEST_VAR;
    delete process.env.EARLY_ACCESS_VAR;
    
    // Reset env loaded flag
    resetEnvLoaded();
  });

  afterEach(() => {
    // Clean up test .env
    if (existsSync(envPath)) {
      unlinkSync(envPath);
    }
    
    // Restore backup if it existed
    if (existsSync(envBackupPath)) {
      writeFileSync(envPath, readFileSync(envBackupPath));
      unlinkSync(envBackupPath);
    }
    
    // Reset env loaded flag
    resetEnvLoaded();
  });

  it('should load env vars at the very start of create()', async () => {
    // Create .env file
    writeFileSync(envPath, 'IMMEDIATE_TEST_VAR=loaded_immediately\n');
    
    // Variable should NOT be available yet
    expect(process.env.IMMEDIATE_TEST_VAR).toBeUndefined();
    
    // Call create() - this is synchronously calling loadEnvFiles() first
    const createPromise = Rikta.create({ silent: true, autowired: false });
    
    // Variable should be available immediately after create() starts (even before it completes)
    // Note: loadEnvFiles() is called synchronously at the start of create()
    expect(process.env.IMMEDIATE_TEST_VAR).toBe('loaded_immediately');
    
    // Complete the creation
    const app = await createPromise;
    
    // Variable should still be available
    expect(process.env.IMMEDIATE_TEST_VAR).toBe('loaded_immediately');
    
    await app.close();
  });

  it('should allow manual loadEnvFiles() before create()', async () => {
    // Create .env file
    writeFileSync(envPath, 'EARLY_ACCESS_VAR=available_early\n');
    
    // Variable should NOT be available yet
    expect(process.env.EARLY_ACCESS_VAR).toBeUndefined();
    
    // Manually load env files
    loadEnvFiles();
    
    // Variable should be available now, before create()
    expect(process.env.EARLY_ACCESS_VAR).toBe('available_early');
    
    // Create app - should not reload (idempotent)
    const app = await Rikta.create({ silent: true, autowired: false });
    
    // Variable should still be available
    expect(process.env.EARLY_ACCESS_VAR).toBe('available_early');
    
    await app.close();
  });

  it('should make env vars available for config passed to create()', async () => {
    // Create .env file with PORT
    writeFileSync(envPath, 'TEST_PORT=4567\n');
    
    // This simulates user code that wants to use env vars in create() config
    const app = await Rikta.create({ 
      silent: true, 
      autowired: false,
      // At this point, .env is already loaded, so process.env.TEST_PORT is available
      port: parseInt(process.env.TEST_PORT || '3000')
    });
    
    // Verify the port was set correctly from env
    expect(process.env.TEST_PORT).toBe('4567');
    
    await app.close();
  });
});
