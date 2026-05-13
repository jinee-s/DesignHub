# Backend Tests

Simple, lightweight tests without external test frameworks.

## Running Tests

### Run all tests:
```bash
npm test
```

### Run unit tests only:
```bash
npm run test:unit
```

### Run integration tests only:
```bash
npm run test:integration
```

## Test Descriptions

### Unit Tests (`validation.unit.test.js`)
Tests the validation middleware validators:
- `isString()` - Non-empty string validation
- `isEmail()` - Email format validation
- `isUsername()` - Username pattern validation (3-30 chars, alphanumeric)
- `isPassword()` - Password strength validation (8+ chars, uppercase, lowercase, number)
- `isURL()` - URL format validation
- `sanitize()` - XSS prevention via character removal

**Why no test framework?** These are pure utility functions that need no setup. Direct assertion tests are simpler and faster.

### Integration Tests (`api.integration.test.js`)
Tests live API endpoints:
- Health check endpoint
- Readiness check endpoint
- 404 error handling
- CORS headers
- Input validation (returns 400 for missing fields)

**Why no Puppeteer?** These tests validate API responses directly without needing a browser. Much faster and simpler to maintain.

## Test Results

Both test suites output:
```
✅ Test Name
✅ Another Test
❌ Failed Test
  Error: Details about failure

=============================================================
RESULTS: 9 passed, 1 failed
=============================================================
```

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Requirements

- Node.js 14+
- Backend server running on `http://localhost:5000` (for integration tests)

## Configuration

Integration tests use environment variables:
```bash
API_URL=http://localhost:5000 npm run test:integration
```

## No External Dependencies

These tests intentionally avoid test frameworks to:
1. Reduce complexity
2. Minimize installation issues (no Puppeteer, Jest config, etc.)
3. Make tests easy to understand and modify
4. Keep startup time instant

## Future Enhancements

If you need more sophisticated testing:
1. Add `jest` for snapshot testing
2. Add `@testing-library/react` for component testing
3. Add `supertest` for better HTTP testing
4. Add coverage reports with `c8`

For now, these minimal tests verify core functionality without dependencies.
