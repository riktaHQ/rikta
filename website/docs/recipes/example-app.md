---
sidebar_position: 1
---

# Example Application

This guide walks through a complete example application demonstrating Rikta's features.

## Application Overview

We'll build a **Task Management API** with:

- User authentication (JWT)
- CRUD operations for tasks
- Role-based access control
- Input validation with Zod
- Database integration with TypeORM
- OpenAPI documentation

## Project Structure

```
task-api/
├── src/
│   ├── config/
│   │   ├── app.config.ts
│   │   └── database.config.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── task.controller.ts
│   │   └── user.controller.ts
│   ├── entities/
│   │   ├── task.entity.ts
│   │   └── user.entity.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── roles.guard.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── task.service.ts
│   │   └── user.service.ts
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   └── task.schema.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Entities

### User Entity

```typescript
// src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Task } from './task.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: 'admin' | 'user';

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Task, task => task.user)
  tasks: Task[];
}
```

### Task Entity

```typescript
// src/entities/task.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ nullable: true })
  dueDate: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.tasks)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
```

## Validation Schemas

```typescript
// src/schemas/auth.schema.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
```

```typescript
// src/schemas/task.schema.ts
import { z } from 'zod';
import { TaskStatus } from '../entities/task.entity';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.coerce.date().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
export type TaskQueryDto = z.infer<typeof TaskQuerySchema>;
```

## Services

### Auth Service

```typescript
// src/services/auth.service.ts
import { Injectable, Autowired, UnauthorizedException, ConflictException } from '@riktajs/core';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserService } from './user.service';
import { RegisterDto, LoginDto } from '../schemas/auth.schema';

@Injectable()
export class AuthService {
  @Autowired()
  private userService!: UserService;

  private readonly jwtSecret = process.env.JWT_SECRET || 'secret';

  async register(data: RegisterDto) {
    const existing = await this.userService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userService.create({
      ...data,
      password: hashedPassword,
    });

    const { password, ...result } = user;
    return result;
  }

  async login(data: LoginDto) {
    const user = await this.userService.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: '1h' }
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  verifyToken(token: string) {
    return jwt.verify(token, this.jwtSecret) as { sub: string; email: string; role: string };
  }
}
```

### Task Service

```typescript
// src/services/task.service.ts
import { Injectable, NotFoundException } from '@riktajs/core';
import { InjectRepository } from '@riktajs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../schemas/task.schema';

@Injectable()
export class TaskService {
  @InjectRepository(Task)
  private taskRepository!: Repository<Task>;

  async findAll(userId: string, query: TaskQueryDto) {
    const { status, page, limit } = query;
    
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    const [tasks, total] = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const task = await this.taskRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(userId: string, data: CreateTaskDto) {
    const task = this.taskRepository.create({
      ...data,
      userId,
    });

    return this.taskRepository.save(task);
  }

  async update(id: string, userId: string, data: UpdateTaskDto) {
    const task = await this.findOne(id, userId);
    
    Object.assign(task, data);
    return this.taskRepository.save(task);
  }

  async delete(id: string, userId: string) {
    const task = await this.findOne(id, userId);
    await this.taskRepository.remove(task);
    return { message: 'Task deleted' };
  }
}
```

## Guards

### Auth Guard

```typescript
// src/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Autowired } from '@riktajs/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  @Autowired()
  private authService!: AuthService;

  @Autowired()
  private userService!: UserService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.authService.verifyToken(token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### Roles Guard

```typescript
// src/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@riktajs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = context.getMetadata<string[]>(ROLES_KEY);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

## Controllers

### Auth Controller

```typescript
// src/controllers/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Req } from '@riktajs/core';
import { ApiTags, ApiOperation, ApiResponse } from '@riktajs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterSchema, LoginSchema } from '../schemas/auth.schema';
import { AuthGuard } from '../guards/auth.guard';

@Controller('/auth')
@ApiTags('Authentication')
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  register(@Body(RegisterSchema) data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body(LoginSchema) data: LoginDto) {
    return this.authService.login(data);
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiSecurity('bearerAuth')
  getProfile(@Req() req: any) {
    const { password, ...user } = req.user;
    return user;
  }
}
```

### Task Controller

```typescript
// src/controllers/task.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, Autowired } from '@riktajs/core';
import { ApiTags, ApiOperation, ApiSecurity, ApiParam, ApiQuery } from '@riktajs/swagger';
import { TaskService } from '../services/task.service';
import { AuthGuard } from '../guards/auth.guard';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '../schemas/task.schema';
import { z } from 'zod';

@Controller('/tasks')
@ApiTags('Tasks')
@ApiSecurity('bearerAuth')
@UseGuards(AuthGuard)
export class TaskController {
  @Autowired()
  private taskService!: TaskService;

  @Get()
  @ApiOperation({ summary: 'Get all tasks for current user' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Req() req: any, @Query(TaskQuerySchema) query: z.infer<typeof TaskQuerySchema>) {
    return this.taskService.findAll(req.user.id, query);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.taskService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@Req() req: any, @Body(CreateTaskSchema) data: z.infer<typeof CreateTaskSchema>) {
    return this.taskService.create(req.user.id, data);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', type: 'string' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body(UpdateTaskSchema) data: z.infer<typeof UpdateTaskSchema>,
  ) {
    return this.taskService.update(id, req.user.id, data);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', type: 'string' })
  delete(@Req() req: any, @Param('id') id: string) {
    return this.taskService.delete(id, req.user.id);
  }
}
```

## Main Entry Point

```typescript
// src/index.ts
import 'dotenv/config';
import { Rikta } from '@riktajs/core';
import { initializeTypeOrm } from '@riktajs/typeorm';
import { setupSwagger } from '@riktajs/swagger';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';

async function bootstrap() {
  // Initialize TypeORM
  await initializeTypeOrm({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'taskapi',
    entities: [User, Task],
    synchronize: process.env.NODE_ENV !== 'production',
  });

  // Create Rikta app
  const app = await Rikta.create({
    port: parseInt(process.env.PORT || '3000'),
    autowired: ['./src'],
  });

  // Setup Swagger
  setupSwagger(app, {
    title: 'Task Management API',
    description: 'API for managing tasks',
    version: '1.0.0',
    securityDefinitions: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  });

  await app.listen();
  console.log('🚀 Task API running at http://localhost:3000');
  console.log('📚 Swagger UI at http://localhost:3000/api-docs');
}

bootstrap();
```

## Running the Example

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations (if using migrations)
npm run typeorm migration:run

# Start development server
npm run dev
```

## Testing the API

```bash
# Register a user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Create a task (use the token from login)
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","description":"Learn Rikta"}'

# Get all tasks
curl http://localhost:3000/tasks \
  -H "Authorization: Bearer <token>"
```

This example demonstrates all the key features of Rikta in a real-world application context.
