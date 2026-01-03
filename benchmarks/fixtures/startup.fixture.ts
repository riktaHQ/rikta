import 'reflect-metadata';
import { Injectable, Controller, Get, Autowired } from '@riktajs/core';

@Injectable()
export class StartupBenchService {
  getData() {
    return { message: 'Hello from service' };
  }
}

@Controller('/bench')
export class StartupBenchController {
  constructor(
    @Autowired(StartupBenchService) private service: StartupBenchService
  ) {}

  @Get('/hello')
  getHello() {
    return this.service.getData();
  }

  @Get('/simple')
  getSimple() {
    return { message: 'Simple response' };
  }
}
