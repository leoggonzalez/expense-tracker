export type PersistedStorage = "session" | "local";

export class PersistedValue<T> {
  private readonly key: string;
  private readonly storage: PersistedStorage;

  public constructor(key: string, storage: PersistedStorage = "session") {
    this.key = key;
    this.storage = storage;
  }

  public load(): T | null {
    const storage = this.getStorage();

    if (!storage) {
      return null;
    }

    const value = storage.getItem(this.key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  public save(value: T): void {
    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    storage.setItem(this.key, JSON.stringify(value));
  }

  public clear(): void {
    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    storage.removeItem(this.key);
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return this.storage === "local"
      ? window.localStorage
      : window.sessionStorage;
  }
}
