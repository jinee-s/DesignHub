/**
 * Backend Unit Tests
 * Tests validation middleware and error handling
 */

import {
  isString,
  isEmail,
  isUsername,
  isPassword,
  isURL,
  sanitize,
} from '../src/middleware/validationMiddleware.js';

/**
 * Simple test runner
 */
function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    return true;
  } catch (err) {
    console.log(`❌ ${description}`);
    console.log(`  Error: ${err.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Run all tests
 */
function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('BACKEND UNIT TESTS - Validation Middleware');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  // isString tests
  if (test('isString accepts non-empty strings', () => {
    assert(isString('hello') === true);
    assert(isString('  hello  ') === true); // trimmed
  })) passed++;
  else failed++;

  if (test('isString rejects empty strings', () => {
    assert(isString('') === false);
    assert(isString('   ') === false);
  })) passed++;
  else failed++;

  if (test('isString rejects non-strings', () => {
    assert(isString(null) === false);
    assert(isString(123) === false);
    assert(isString(undefined) === false);
  })) passed++;
  else failed++;

  // isEmail tests
  if (test('isEmail validates correct emails', () => {
    assert(isEmail('john@example.com') === true);
    assert(isEmail('test.user+tag@domain.co.uk') === true);
  })) passed++;
  else failed++;

  if (test('isEmail rejects invalid emails', () => {
    assert(isEmail('not-an-email') === false);
    assert(isEmail('missing@domain') === false);
    assert(isEmail('@example.com') === false);
  })) passed++;
  else failed++;

  // isUsername tests
  if (test('isUsername validates correct usernames', () => {
    assert(isUsername('john_doe') === true);
    assert(isUsername('user123') === true);
    assert(isUsername('valid-user') === true);
  })) passed++;
  else failed++;

  if (test('isUsername rejects invalid usernames', () => {
    assert(isUsername('ab') === false); // too short
    assert(isUsername('a very long username that exceeds the maximum length') === false); // too long
    assert(isUsername('user@name') === false); // invalid chars
    assert(isUsername('user name') === false); // spaces
  })) passed++;
  else failed++;

  // isPassword tests
  if (test('isPassword validates secure passwords', () => {
    assert(isPassword('SecurePass123') === true);
    assert(isPassword('MyPassword2024') === true);
  })) passed++;
  else failed++;

  if (test('isPassword rejects weak passwords', () => {
    assert(isPassword('short') === false); // too short
    assert(isPassword('nouppercase123') === false); // no uppercase
    assert(isPassword('NOLOWERCASE123') === false); // no lowercase
    assert(isPassword('NoNumbers') === false); // no numbers
  })) passed++;
  else failed++;

  // isURL tests
  if (test('isURL validates correct URLs', () => {
    assert(isURL('http://example.com') === true);
    assert(isURL('https://example.com/path') === true);
    assert(isURL('https://images.unsplash.com/photo-123?w=400') === true);
  })) passed++;
  else failed++;

  if (test('isURL rejects invalid URLs', () => {
    assert(isURL('not-a-url') === false);
    assert(isURL('example.com') === false); // missing protocol
  })) passed++;
  else failed++;

  // sanitize tests
  if (test('sanitize removes dangerous characters', () => {
    assert(sanitize('  hello  ') === 'hello');
    assert(sanitize('<script>alert</script>') === 'scriptalert/script');
    assert(sanitize('normal text') === 'normal text');
  })) passed++;
  else failed++;

  if (test('sanitize handles non-strings', () => {
    assert(sanitize(null) === null);
    assert(sanitize(123) === 123);
  })) passed++;
  else failed++;

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests();
