declare module "bun:test" {
  export interface Test {
    name: string;
    fn: () => void | Promise<void>;
    skip?: boolean;
    todo?: boolean;
    only?: boolean;
  }

  export function test(name: string, fn: () => void | Promise<void>): void;
  export function test(options: Test): void;
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function before(fn: () => void | Promise<void>): void;
  export function after(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;

  export function expect(value: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toHaveLength(length: number): void;
    toContain(item: unknown): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeGreaterThan(value: number): void;
    toBeLessThan(value: number): void;
    toThrow(message?: string | RegExp): void;
    toMatch(pattern: string | RegExp): void;
    toHaveProperty(property: string | string[], value?: unknown): void;
    not: {
      toBe(expected: unknown): void;
      toEqual(expected: unknown): void;
      toContain(item: unknown): void;
      toBeNull(): void;
      toBeUndefined(): void;
    };
  };
}
