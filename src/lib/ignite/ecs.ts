import { Renderer } from "./renderer";

export class ECS {
  private _entities: Set<number> = new Set();
  private _components: Map<number, Record<string, any>> = new Map();
  private _entitiesToRemove: Set<number> = new Set();

  // The id that was most recently assigned to an entity.
  // Will be -1 if no entity has been created yet.
  private _lastId: number = -1;

  private _systems: UpdateSystem[] = [];

  get entityCount(): number {
    return this._entities.size;
  }

  registerSystem(system: UpdateSystem): void {
    this._systems.push(system);
  }

  addComponent<T>(entityId: number, componentName: string, component: T): void {
    if (!this._components.has(entityId)) {
      this._components.set(entityId, {});
    }

    const entityComponents = this._components.get(entityId)!;
    entityComponents[componentName] = component;

    for (const system of this._systems) {
      system.tryAddEntity(entityId);
    }
  }

  removeComponent(entityId: number, componentName: string): void {
    const components = this._components.get(entityId);
    if (components && componentName in components) {
      delete components[componentName];
      for (const system of this._systems) {
        system.tryRemoveEntity(entityId);
      }
    }
  }

  markEntityForRemoval(entityId: number): void {
    this._entitiesToRemove.add(entityId);
  }

  finalizeRemovals(): void {
    for (const entityId of this._entitiesToRemove) {
      this._entities.delete(entityId);
      this._components.delete(entityId);
      for (const system of this._systems) {
        system.removeEntity(entityId); // force-remove without checking
      }
    }
    this._entitiesToRemove.clear();
  }

  // Get a component for a specific entity
  getComponent<T>(entityId: number, componentName: string): T | undefined {
    return this._components.get(entityId)?.[componentName];
  }

  // Add a new entity to the ECS.
  createEntity(): number {
    this._lastId += 1;
    this._entities.add(this._lastId);
    this._components.set(this._lastId, {});
    return this._lastId;
  }

  getEntities(): Iterable<number> {
    return this._entities;
  }
}

export type ComponentType<T> = {
  key: symbol;
  default(): T;
};

export abstract class UpdateSystem {
  protected readonly _ecs: ECS;
  private readonly _entities: Set<number> = new Set();
  private readonly _required: string[];

  constructor(ecs: ECS, required: string[]) {
    this._ecs = ecs;
    this._required = required;

    ecs.registerSystem(this);
  }

  tryAddEntity(entityId: number): void {
    if (this.hasRequiredComponents(entityId)) {
      this._entities.add(entityId);
    }
  }

  tryRemoveEntity(entityId: number): void {
    if (!this.hasRequiredComponents(entityId)) {
      this._entities.delete(entityId);
    }
  }

  removeEntity(entityId: number): void {
    this._entities.delete(entityId);
  }

  protected getEntities(): Iterable<number> {
    return this._entities;
  }

  private hasRequiredComponents(entityId: number): boolean {
    return this._required.every(
      (name) => this._ecs.getComponent(entityId, name) !== undefined
    );
  }

  abstract update(dt: number): void;
}

export abstract class RenderSystem extends UpdateSystem {
  abstract draw(renderer: Renderer): void;
}
