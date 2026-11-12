/**
 * jest.d.ts
 *
 * Ambient type declaration for the test files (src/utils/__tests__, src/components/app/__tests__).
 * It only contains a triple-slash directive, so it has no runtime effect and is never imported.
 */

// TypeScript 6 no longer loads every @types package by default:
// expose the Jest globals (describe, it, expect) to the tests
/// <reference types="jest" />
