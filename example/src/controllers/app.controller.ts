import {Controller, Get, Autowired} from '@riktajs/core';
import {HealthService, HealthStatus} from '../services/health.service';
import {APP_CONFIG} from '../config/app.config';
import {AppConfigProvider} from "../config/app-config.provider";

/**
 * Root Application Controller
 */
@Controller()
export class AppController {
  @Autowired()
  private healthService!: HealthService;

  @Autowired(APP_CONFIG)
  private config!: AppConfigProvider;

  /**
   * GET /
   * Application info
   */
  @Get()
  getInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      environment: this.config.environment,
      endpoints: {
        health: 'GET /health',
        users: 'GET|POST /users',
        user: 'GET|PUT|DELETE /users/:id',
      },
    };
  }

  /**
   * GET /health
   * Health check endpoint
   */
  @Get('/health')
  getHealth(): HealthStatus {
    return this.healthService.getStatus();
  }
}

