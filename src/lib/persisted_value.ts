export class PersistedValue<T> {
  private readonly key: string;

  public constructor(key: string) {
    this.key = key;
  }

  public load(): T | null {
    if (!this.canUseSessionStorage()) {
      return null;
    }

    const value = window.sessionStorage.getItem(this.key);

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
    if (!this.canUseSessionStorage()) {
      return;
    }

    window.sessionStorage.setItem(this.key, JSON.stringify(value));
  }

  public clear(): void {
    if (!this.canUseSessionStorage()) {
      return;
    }

    window.sessionStorage.removeItem(this.key);
  }

  private canUseSessionStorage(): boolean {
    return typeof window !== "undefined";
  }
}
