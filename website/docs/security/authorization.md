---
sidebar_position: 2
---

# Authorization

Authorization determines what an authenticated user can do. Rikta provides flexible mechanisms for implementing fine-grained access control.

## Introduction

While **authentication** verifies identity, **authorization** controls access:

```
┌─────────────────────────────────────────────────────────┐
│                      Request Flow                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Request ──▶ Auth Guard ──▶ Roles Guard ──▶ Handler    │
│                  │              │                        │
│                  │              ▼                        │
│                  │        Check Permissions              │
│                  ▼                                       │
│           Verify Identity                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Role-Based Access Control (RBAC)

### Roles Decorator

Create a decorator to define required roles:

```typescript
import { SetMetadata } from '@riktajs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### Roles Guard

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@riktajs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = context.getMetadata<string[]>(ROLES_KEY);
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const request = context.getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some(role => user.roles?.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### Usage

```typescript
@Controller('/admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  @Get('/dashboard')
  @Roles('admin')
  getDashboard() {
    return { data: 'Admin dashboard' };
  }

  @Get('/reports')
  @Roles('admin', 'manager')
  getReports() {
    return { data: 'Reports - accessible to admin and manager' };
  }

  @Delete('/users/:id')
  @Roles('super-admin')
  deleteUser(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
```

## Permission-Based Access Control

For more granular control, use permissions instead of roles:

### Permission Types

```typescript
export const Permissions = {
  // Users
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Posts
  POST_CREATE: 'post:create',
  POST_READ: 'post:read',
  POST_UPDATE: 'post:update',
  POST_DELETE: 'post:delete',
  POST_PUBLISH: 'post:publish',
  
  // Admin
  ADMIN_ACCESS: 'admin:access',
  ADMIN_SETTINGS: 'admin:settings',
} as const;

type Permission = typeof Permissions[keyof typeof Permissions];
```

### Permissions Decorator

```typescript
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

### Permissions Guard

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = context.getMetadata<Permission[]>(PERMISSIONS_KEY);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userPermissions = this.getUserPermissions(user);
    const hasPermission = requiredPermissions.every(
      perm => userPermissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private getUserPermissions(user: User): Permission[] {
    // Get permissions from user's roles
    const rolePermissions = user.roles.flatMap(role => 
      this.rolePermissionMap[role] || []
    );
    
    // Combine with direct user permissions
    return [...new Set([...rolePermissions, ...user.permissions])];
  }

  private rolePermissionMap: Record<string, Permission[]> = {
    admin: [
      Permissions.USER_CREATE,
      Permissions.USER_READ,
      Permissions.USER_UPDATE,
      Permissions.USER_DELETE,
      Permissions.ADMIN_ACCESS,
    ],
    editor: [
      Permissions.POST_CREATE,
      Permissions.POST_READ,
      Permissions.POST_UPDATE,
      Permissions.POST_PUBLISH,
    ],
    viewer: [
      Permissions.USER_READ,
      Permissions.POST_READ,
    ],
  };
}
```

### Usage

```typescript
@Controller('/posts')
@UseGuards(AuthGuard, PermissionsGuard)
export class PostController {
  @Get()
  @RequirePermissions(Permissions.POST_READ)
  findAll() {
    return this.postService.findAll();
  }

  @Post()
  @RequirePermissions(Permissions.POST_CREATE)
  create(@Body() data: CreatePostDto) {
    return this.postService.create(data);
  }

  @Put('/:id/publish')
  @RequirePermissions(Permissions.POST_UPDATE, Permissions.POST_PUBLISH)
  publish(@Param('id') id: string) {
    return this.postService.publish(id);
  }
}
```

## Resource-Based Authorization

Check if user can access specific resources:

```typescript
@Injectable()
export class PostOwnerGuard implements CanActivate {
  @Autowired()
  private postService!: PostService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const user = request.user;
    const postId = request.params.id;

    const post = await this.postService.findById(postId);
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Allow if user is owner or admin
    if (post.authorId !== user.id && !user.roles.includes('admin')) {
      throw new ForbiddenException('You can only access your own posts');
    }

    request.post = post;
    return true;
  }
}

@Controller('/posts')
@UseGuards(AuthGuard)
export class PostController {
  @Put('/:id')
  @UseGuards(PostOwnerGuard)
  update(@Param('id') id: string, @Body() data: UpdatePostDto) {
    // Only owner or admin can update
    return this.postService.update(id, data);
  }

  @Delete('/:id')
  @UseGuards(PostOwnerGuard)
  delete(@Param('id') id: string) {
    // Only owner or admin can delete
    return this.postService.delete(id);
  }
}
```

## Policy-Based Authorization

For complex authorization logic:

```typescript
// Define policies
interface Policy {
  name: string;
  check: (user: User, resource: any) => boolean;
}

@Injectable()
export class PolicyService {
  private policies: Map<string, Policy> = new Map();

  register(policy: Policy) {
    this.policies.set(policy.name, policy);
  }

  can(user: User, policyName: string, resource?: any): boolean {
    const policy = this.policies.get(policyName);
    if (!policy) return false;
    return policy.check(user, resource);
  }
}

// Register policies
const policies: Policy[] = [
  {
    name: 'editPost',
    check: (user, post) => {
      // Author can edit their posts
      if (post.authorId === user.id) return true;
      // Editors can edit any post
      if (user.roles.includes('editor')) return true;
      // Admins can do anything
      if (user.roles.includes('admin')) return true;
      return false;
    },
  },
  {
    name: 'deleteUser',
    check: (user, targetUser) => {
      // Can't delete yourself
      if (targetUser.id === user.id) return false;
      // Only super-admin can delete admins
      if (targetUser.roles.includes('admin')) {
        return user.roles.includes('super-admin');
      }
      // Admins can delete regular users
      return user.roles.includes('admin');
    },
  },
];
```

## Attribute-Based Access Control (ABAC)

For dynamic authorization based on attributes:

```typescript
interface AccessContext {
  user: User;
  resource: any;
  action: string;
  environment: {
    time: Date;
    ip: string;
  };
}

@Injectable()
export class AbacService {
  can(context: AccessContext): boolean {
    const { user, resource, action, environment } = context;

    // Time-based restrictions
    const hour = environment.time.getHours();
    if (action === 'delete' && (hour < 9 || hour > 17)) {
      // No deletions outside business hours
      return false;
    }

    // IP-based restrictions for admin actions
    if (action.startsWith('admin:') && !this.isAllowedIp(environment.ip)) {
      return false;
    }

    // Resource-specific rules
    if (resource.status === 'archived' && action === 'edit') {
      // Only admins can edit archived resources
      return user.roles.includes('admin');
    }

    return true;
  }

  private isAllowedIp(ip: string): boolean {
    const allowedIps = ['192.168.1.0/24', '10.0.0.0/8'];
    // Check if IP is in allowed range
    return true; // Simplified
  }
}
```

## Combining Guards

Apply multiple authorization layers:

```typescript
@Controller('/admin/users')
@UseGuards(
  AuthGuard,           // Must be authenticated
  RolesGuard,          // Must have admin role
  PermissionsGuard,    // Must have specific permission
)
@Roles('admin')
export class AdminUserController {
  @Get()
  @RequirePermissions(Permissions.USER_READ)
  findAll() {}

  @Post()
  @RequirePermissions(Permissions.USER_CREATE)
  create() {}

  @Delete('/:id')
  @RequirePermissions(Permissions.USER_DELETE)
  delete() {}
}
```

## Best Practices

### 1. Principle of Least Privilege

```typescript
// ✅ Good - specific permissions
@RequirePermissions(Permissions.POST_READ)
@Get('/:id')
findOne() {}

// ❌ Avoid - overly broad
@Roles('admin')
@Get('/:id')
findOne() {}
```

### 2. Defense in Depth

```typescript
// Multiple layers of protection
@Controller('/sensitive')
@UseGuards(AuthGuard)           // Layer 1: Authentication
@UseGuards(RolesGuard)          // Layer 2: Role check
@UseGuards(PermissionsGuard)    // Layer 3: Permission check
@UseGuards(RateLimitGuard)      // Layer 4: Rate limiting
export class SensitiveController {}
```

### 3. Fail Secure

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  try {
    // Authorization logic
    return this.checkAccess(user, resource);
  } catch (error) {
    // On any error, deny access
    this.logger.error('Authorization error', { error });
    return false;
  }
}
```

### 4. Audit Authorization Decisions

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const allowed = await this.checkAccess(user, resource, action);
  
  // Log all authorization decisions
  this.auditLog.log({
    userId: user.id,
    action,
    resource: resource.id,
    allowed,
    timestamp: new Date(),
    ip: request.ip,
  });

  return allowed;
}
```

### 5. Test Authorization Thoroughly

```typescript
describe('RolesGuard', () => {
  it('should allow admin to access admin routes', async () => {
    const user = { roles: ['admin'] };
    const result = await guard.canActivate(mockContext(user));
    expect(result).toBe(true);
  });

  it('should deny regular user from admin routes', async () => {
    const user = { roles: ['user'] };
    await expect(guard.canActivate(mockContext(user)))
      .rejects.toThrow(ForbiddenException);
  });
});
```
