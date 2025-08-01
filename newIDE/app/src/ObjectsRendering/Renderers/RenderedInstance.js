// @flow
import * as PIXI from 'pixi.js-legacy';
import PixiResourcesLoader from '../../ObjectsRendering/PixiResourcesLoader';

/**
 * RenderedInstance is the base class used for creating 2D renderers of instances,
 * which display on the scene editor, using Pixi.js, the instance of an object (see InstancesEditor).
 */
export default class RenderedInstance {
  _project: gdProject;
  _instance: gdInitialInstance;
  _associatedObjectConfiguration: gdObjectConfiguration;
  _pixiContainer: PIXI.Container;
  _pixiResourcesLoader: Class<PixiResourcesLoader>;
  _pixiObject: PIXI.DisplayObject;
  wasUsed: boolean;
  _wasDestroyed: boolean;
  _getPropertyOverridings: (() => Map<string, string>) | null;

  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration,
    pixiContainer: PIXI.Container,
    pixiResourcesLoader: Class<PixiResourcesLoader>,
    getPropertyOverridings: (() => Map<string, string>) | null = null
  ) {
    this._pixiObject = null;
    this._instance = instance;
    this._associatedObjectConfiguration = associatedObjectConfiguration;
    this._pixiContainer = pixiContainer;
    this._project = project;
    this._pixiResourcesLoader = pixiResourcesLoader;
    this._getPropertyOverridings = getPropertyOverridings;
    this.wasUsed = true; //Used by InstancesRenderer to track rendered instance that are not used anymore.
    this._wasDestroyed = false;
  }

  isRenderedIn3D(): boolean {
    return false;
  }

  /**
   * Convert an angle from degrees to radians.
   */
  static toRad(angleInDegrees: number) {
    return (angleInDegrees / 180) * Math.PI;
  }

  /**
   * Called when the scene editor is rendered.
   */
  update() {
    //Nothing to do.
  }

  getPixiObject(): PIXI.DisplayObject | null {
    return this._pixiObject;
  }

  getInstance(): gdInitialInstance {
    return this._instance;
  }

  /**
   * Called to notify the instance renderer that its associated instance was removed from
   * the scene. The PIXI object should probably be removed from the container: This is what
   * the default implementation of the method does.
   */
  onRemovedFromScene(): void {
    this._wasDestroyed = true;
    if (this._pixiObject !== null)
      this._pixiContainer.removeChild(this._pixiObject);
  }

  getOriginX(): number {
    return 0;
  }

  getOriginY(): number {
    return 0;
  }

  getOriginZ(): number {
    return 0;
  }

  getCenterX(): number {
    return this.getWidth() / 2;
  }

  getCenterY(): number {
    return this.getHeight() / 2;
  }

  getCustomWidth(): number {
    return this._instance.getCustomWidth();
  }

  getCustomHeight(): number {
    return this._instance.getCustomHeight();
  }

  getWidth(): number {
    return this._instance.hasCustomSize()
      ? this.getCustomWidth()
      : this.getDefaultWidth();
  }

  getHeight(): number {
    return this._instance.hasCustomSize()
      ? this.getCustomHeight()
      : this.getDefaultHeight();
  }

  getDepth(): number {
    return 0;
  }

  /**
   * Return the width of the instance when the instance doesn't have a custom size.
   */
  getDefaultWidth(): number {
    return 32;
  }

  /**
   * Return the height of the instance when the instance doesn't have a custom size.
   */
  getDefaultHeight(): number {
    return 32;
  }

  getDefaultDepth(): number {
    return 0;
  }

  getPropertyOverridings(): Map<string, string> | null {
    return this._getPropertyOverridings && this._getPropertyOverridings();
  }
}
