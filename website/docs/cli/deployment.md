---
sidebar_position: 3
---

# Deployment

Learn how to deploy your Rikta application to production.

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 2. Set Environment Variables

```bash
export NODE_ENV=production
export PORT=3000
```

### 3. Start the Application

```bash
npm run start
# or
node dist/index.js
```

## Docker Deployment

### Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=myapp
      - DB_USERNAME=postgres
      - DB_PASSWORD=secret
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build the image
docker build -t my-rikta-app .

# Run the container
docker run -p 3000:3000 -e NODE_ENV=production my-rikta-app

# Or with docker-compose
docker-compose up -d
```

## Cloud Deployments

### Render

1. Push your code to GitHub
2. Connect your repository to Render
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variables**: Set your production variables

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Fly.io

1. Install the Fly CLI:

```bash
curl -L https://fly.io/install.sh | sh
```

2. Create `fly.toml`:

```toml
app = "my-rikta-app"
primary_region = "iad"

[build]

[env]
  PORT = "3000"
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

3. Deploy:

```bash
fly launch
fly deploy
```

### Vercel

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

Deploy:

```bash
npm run build
vercel --prod
```

## PM2 Process Management

For VPS or bare-metal deployments, use PM2:

### Install PM2

```bash
npm install -g pm2
```

### Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'rikta-app',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

### Start Application

```bash
# Start in production
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs

# Monitor
pm2 monit

# Restart
pm2 restart rikta-app

# Stop
pm2 stop rikta-app

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

## Environment Configuration

### Production .env Example

```env
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=production-db.example.com
DB_PORT=5432
DB_DATABASE=myapp_prod
DB_USERNAME=myapp
DB_PASSWORD=secure-password

# Security
JWT_SECRET=your-super-secret-key
API_KEY=your-api-key

# Logging
LOG_LEVEL=info
```

### Loading Environment Variables

```typescript
// src/index.ts
import 'dotenv/config'; // Load .env file
import { Rikta } from '@riktajs/core';

async function bootstrap() {
  const app = await Rikta.create({
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    autowired: ['./src'],
  });

  await app.listen();
}

bootstrap();
```

## Health Checks

Implement health check endpoints for container orchestrators:

```typescript
@Controller('/health')
export class HealthController {
  @Autowired()
  private database!: DatabaseService;

  @Get()
  health() {
    return { status: 'ok' };
  }

  @Get('/ready')
  async readiness() {
    const dbHealthy = await this.checkDatabase();
    
    if (!dbHealthy) {
      throw new ServiceUnavailableException('Database not ready');
    }
    
    return { status: 'ready' };
  }

  @Get('/live')
  liveness() {
    return { status: 'alive' };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.database.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
```

## Graceful Shutdown

Handle shutdown signals properly:

```typescript
import { Rikta } from '@riktajs/core';

async function bootstrap() {
  const app = await Rikta.create({
    port: 3000,
    autowired: ['./src'],
  });

  await app.listen();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
```

## Best Practices

### 1. Use Non-Root User in Docker

```dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### 2. Multi-Stage Builds

Keep images small by using multi-stage builds (as shown above).

### 3. Health Checks in Docker

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### 4. Set Resource Limits

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### 5. Use Secrets Management

Never commit secrets to version control. Use:
- Docker secrets
- Cloud provider secret managers (AWS Secrets Manager, etc.)
- HashiCorp Vault
