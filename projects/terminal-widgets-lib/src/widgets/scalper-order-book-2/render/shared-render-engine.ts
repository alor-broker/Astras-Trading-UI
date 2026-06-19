import {
  autoDetectRenderer,
  Container,
  Renderer
} from 'pixi.js';

/**
 * Поверхность отрисовки, которую обслуживает общий движок.
 * Реализуется фасадом рендера виджета.
 */
export interface RenderSurface {
  /**
   * Подготавливает кадр (обновляет элементы сцены).
   * Возвращает сцену и размеры в CSS px или null, если отрисовка не требуется.
   */
  prepareFrame(): { stage: Container, width: number, height: number } | null;

  /** Копирует подготовленный кадр из канвы движка на собственную канву поверхности. */
  presentFrame(source: HTMLCanvasElement, width: number, height: number, resolution: number): void;

  /** Уведомление о смене разрешения отрисовки (devicePixelRatio). */
  resolutionChanged(): void;
}

/**
 * Общий движок отрисовки для всех экземпляров виджета.
 *
 * Браузеры ограничивают количество одновременных WebGL контекстов (обычно ~16),
 * поэтому при 100+ виджетах нельзя создавать контекст на каждый экземпляр.
 * Вместо этого используется один общий WebGL renderer: сцена каждого виджета
 * рендерится в общую канву и копируется (blit) на 2D канву виджета.
 *
 * Отрисовка синхронизирована с частотой обновления экрана: кадры планируются
 * через requestAnimationFrame, и поверхность рендерится не чаще одного раза за кадр
 * и только когда она помечена как измененная.
 */
export class SharedRenderEngine {
  private static instance: SharedRenderEngine | null = null;

  private renderer: Renderer | null = null;

  private rendererInit$: Promise<Renderer> | null = null;

  private readonly pendingSurfaces = new Set<RenderSurface>();

  private readonly registeredSurfaces = new Set<RenderSurface>();

  private frameRequested = false;

  private resolution = 1;

  static getInstance(): SharedRenderEngine {
    if (SharedRenderEngine.instance == null) {
      SharedRenderEngine.instance = new SharedRenderEngine();
      SharedRenderEngine.instance.watchResolutionChanges();
    }

    return SharedRenderEngine.instance;
  }

  get rendererResolution(): number {
    return this.resolution;
  }

  async init(): Promise<void> {
    if (this.renderer != null) {
      return;
    }

    this.rendererInit$ ??= this.createRenderer().catch((err: unknown) => {
      // Неудачная инициализация не кэшируется: следующий виджет попробует снова.
      this.rendererInit$ = null;
      throw err;
    });

    await this.rendererInit$;
  }

  register(surface: RenderSurface): void {
    this.registeredSurfaces.add(surface);
  }

  unregister(surface: RenderSurface): void {
    this.registeredSurfaces.delete(surface);
    this.pendingSurfaces.delete(surface);

    if (this.registeredSurfaces.size === 0) {
      this.destroyRenderer();
    }
  }

  /** Помечает поверхность как требующую отрисовки в ближайшем кадре. */
  requestFrame(surface: RenderSurface): void {
    if (!this.registeredSurfaces.has(surface)) {
      return;
    }

    this.pendingSurfaces.add(surface);
    this.scheduleFrame();
  }

  private async createRenderer(): Promise<Renderer> {
    const renderer = await autoDetectRenderer({
      preference: 'webgl',
      width: 16,
      height: 16,
      antialias: true,
      backgroundAlpha: 0,
      autoDensity: false,
      resolution: this.getTargetResolution()
    });

    if (this.registeredSurfaces.size === 0) {
      // Все поверхности удалены, пока рендерер инициализировался.
      renderer.destroy();
      this.rendererInit$ = null;
      return renderer;
    }

    this.renderer = renderer;
    this.resolution = renderer.resolution;

    if (this.pendingSurfaces.size > 0) {
      this.scheduleFrame();
    }

    return renderer;
  }

  private destroyRenderer(): void {
    if (this.renderer != null) {
      this.renderer.destroy();
      this.renderer = null;
      this.rendererInit$ = null;
    }
  }

  private getTargetResolution(): number {
    // Целое разрешение >= dpr (суперсэмплинг при дробном масштабе экрана 125%/150%).
    // На дробном DPI канва, как правило, не попадает на физическую пиксельную сетку
    // (трансформации gridster и т.п.), и рендеринг 1:1 даёт мыло; рендеринг при целом
    // разрешении с последующим уменьшением браузером сохраняет четкость.
    // Атлас шрифта (SharedFontProvider.getResolution) рендерится плотнее этого разрешения
    // (супер-сэмплинг), чтобы мелкий текст оставался чётким; он не должен быть МЕНЬШЕ.
    const dpr = globalThis.devicePixelRatio;
    return Math.min(Math.ceil(dpr > 0 ? dpr : 1), 2);
  }

  /**
   * Отслеживает смену devicePixelRatio (перенос окна на монитор с другим
   * масштабированием, zoom браузера) и перенастраивает разрешение отрисовки.
   * matchMedia срабатывает однократно, поэтому подписка взводится заново.
   */
  private watchResolutionChanges(): void {
    if (typeof globalThis.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = globalThis.matchMedia(`(resolution: ${globalThis.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener(
      'change',
      () => {
        this.applyResolutionChange();
        this.watchResolutionChanges();
      },
      {once: true}
    );
  }

  private applyResolutionChange(): void {
    const newResolution = this.getTargetResolution();
    if (this.renderer == null || newResolution === this.resolution) {
      return;
    }

    this.renderer.resize(this.renderer.width, this.renderer.height, newResolution);
    this.resolution = newResolution;

    for (const surface of this.registeredSurfaces) {
      surface.resolutionChanged();
      this.pendingSurfaces.add(surface);
    }

    this.scheduleFrame();
  }

  private scheduleFrame(): void {
    if (this.frameRequested) {
      return;
    }

    this.frameRequested = true;
    requestAnimationFrame(() => {
      this.frameRequested = false;
      this.renderPendingSurfaces();
    });
  }

  private renderPendingSurfaces(): void {
    const renderer = this.renderer;
    if (renderer == null) {
      // Рендерер еще инициализируется. Кадр будет отрисован после инициализации.
      return;
    }

    const surfaces = Array.from(this.pendingSurfaces);
    this.pendingSurfaces.clear();

    for (const surface of surfaces) {
      if (!this.registeredSurfaces.has(surface)) {
        continue;
      }

      const frame = surface.prepareFrame();
      if (frame == null || frame.width <= 0 || frame.height <= 0) {
        continue;
      }

      // Канва движка только увеличивается, чтобы не пересоздавать back buffer на каждый кадр.
      // Сравнение и resize - в CSS-координатах (renderer.screen), а не в пикселях канвы
      // (renderer.width = CSS * resolution), иначе размер канвы вычисляется неверно.
      const screen = renderer.screen;
      const targetWidth = Math.max(screen.width, Math.ceil(frame.width));
      const targetHeight = Math.max(screen.height, Math.ceil(frame.height));
      if (targetWidth > screen.width || targetHeight > screen.height) {
        renderer.resize(targetWidth, targetHeight);
      }

      renderer.render(frame.stage);

      surface.presentFrame(
        renderer.canvas,
        frame.width,
        frame.height,
        this.resolution
      );
    }
  }
}
