# Passport Example

This example demonstrates how to implement authentication in a Rikta application using `@riktajs/passport`.

## Features

- 🔐 Local (username/password) authentication
- 🍪 Session-based authentication with secure cookies
- 🛡️ Protected routes using `@Authenticated` decorator
- 👤 User injection with `@CurrentUser` decorator
- 📝 In-memory user store (replace with database in production)

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── auth/
│   ├── auth.controller.ts  # Login/logout/profile endpoints
│   ├── auth.service.ts     # Authentication logic
│   └── local.strategy.ts   # Passport local strategy
└── users/
    ├── users.controller.ts # User management endpoints
    └── users.service.ts    # User data access
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run the Application

```bash
# Development mode with hot reload
pnpm dev

# Or build and run
pnpm build
pnpm start
```

The server will start at `http://localhost:3000`.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login with username/password | No |
| POST | `/auth/logout` | Logout current user | Yes |
| GET | `/auth/profile` | Get current user profile | Yes |
| GET | `/auth/status` | Check authentication status | No |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users | No |
| GET | `/users/:id` | Get user by ID | Yes |

## Usage Examples

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -c cookies.txt
```

### Access Protected Route

```bash
curl http://localhost:3000/auth/profile \
  -b cookies.txt
```

### Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

### Check Status

```bash
curl http://localhost:3000/auth/status \
  -b cookies.txt
```

## Default Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| user | user123 | user |

## Configuration

The passport plugin is configured in `main.ts`:

```typescript
await app.server.register(passportPlugin, {
  // Session secret (min 32 characters)
  secret: 'your-super-secret-key-at-least-32-chars',
  
  // Cookie settings
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax',
  },
});
```

## Production Considerations

1. **Use environment variables** for the session secret
2. **Enable secure cookies** when using HTTPS
3. **Use a real database** instead of in-memory storage
4. **Hash passwords** with bcrypt or argon2
5. **Add rate limiting** to prevent brute force attacks
6. **Implement CSRF protection** for cookie-based auth

## Learn More

- [Authentication Guide](/docs/techniques/authentication.md)
- [@riktajs/passport README](/packages/passport/README.md)
- [PassportJS Documentation](https://www.passportjs.org/)
