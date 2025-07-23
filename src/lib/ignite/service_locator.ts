export type Constructor<T> = new (...args: any[]) => T;

/**
 * The service locator can be used to register & locate services globally.
 */
export class ServiceLocator {
  private static services = new Map<Function, any>();

  /**
   * Register a service by type.
   * @param type A class type.
   * @param service A class instance.
   */
  static register<T>(type: Constructor<T>, service: T) {
    this.services.set(type, service);
  }

  /**
   * Resolve a service by type.
   * @param type
   * @returns
   */
  static resolve<T>(type: Constructor<T>): T {
    if (!this.services.has(type)) {
      throw new Error(`No service registered of type: ${type.name}.`);
    }
    return this.services.get(type)!;
  }
}
