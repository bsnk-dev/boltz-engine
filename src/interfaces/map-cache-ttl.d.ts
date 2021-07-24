declare module 'map-cache-ttl' {
  export = class Cache {
    constructor(max_age: string, interval: string);

    get size(): number;

    get(key: string): any;
    set(key: string, value: any, max_age?: string): void;
    delete(key: string): void;
    clear(): void;
    has(key: string): boolean;
    trim(): void;
    proxy(fn: Function, max_age: string): Function;
  }
}
