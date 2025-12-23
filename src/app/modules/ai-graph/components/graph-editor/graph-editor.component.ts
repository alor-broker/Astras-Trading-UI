import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, input, OnDestroy, output, viewChildren, inject } from '@angular/core';
import {GraphConfig} from "../../models/graph.model";
import {
  IContextMenuOptions,
  LGraph,
  LGraphCanvas,
  LGraphNode,
  LiteGraph,
  SerialisableGraph,
} from '@comfyorg/litegraph';
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {asyncScheduler, BehaviorSubject, subscribeOn, take} from "rxjs";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {LetDirective} from "@ngrx/component";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {LiteGraphModelsConverter} from "../../graph/lite-graph-models-converter";
import {NodesRegister} from '../../graph/nodes/nodes-register';
import {NodePropertyInfo} from "../../graph/nodes/models";
import {NodeBase} from "../../graph/nodes/node-base";
import {BackgroundMenuBuilder} from "../../graph/menu/background-menu-builder";
import {SideMenuComponent} from "../side-menu/side-menu.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {SideMenuTitleDirective} from "../../directives/side-menu-title.directive";
import {SideMenuContentDirective} from "../../directives/side-menu-content.directive";
import {TranslocoDirective} from "@jsverse/transloco";
import {filter, map} from "rxjs/operators";
import {RunConfigBtnComponent} from "../run-config-btn/run-config-btn.component";
import {RunStatus} from "../../models/run-results.model";
import {RunResultsComponent} from "../run-results/run-results.component";
import {NodePropertiesEditorComponent} from "../node-properties-editor/node-properties-editor.component";
import {CanvasMouseEvent} from "node_modules/@comfyorg/litegraph/dist/types/events";
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-graph-editor',
  imports: [
    NzResizeObserverDirective,
    LetDirective,
    SideMenuComponent,
    NzIconDirective,
    SideMenuTitleDirective,
    SideMenuContentDirective,
    TranslocoDirective,
    RunConfigBtnComponent,
    RunResultsComponent,
    NodePropertiesEditorComponent
  ],
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.less'
})
export class GraphEditorComponent implements AfterViewInit, OnDestroy {
  private readonly translatorService = inject(TranslatorService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly initialConfig = input<GraphConfig | null>(null);

  readonly updateConfig = output<GraphConfig>();

  readonly canvasQuery = viewChildren<ElementRef<HTMLCanvasElement>>('canvas');
  protected nodeToEdit: NodeBase | null = null;
  protected runStatus: RunStatus | null = null;
  protected containerSize$ = new BehaviorSubject<{
    css: ContentSize;
    canvas: ContentSize;
  }>({
    css: {
      height: 100, width: 100
    },
    canvas: {
      height: 100, width: 100
    }
  });

  protected currentConfig: GraphConfig | null = null;

  protected isRunMenuVisible = false;
  private readonly canvasQueryChanges$ = toObservable(this.canvasQuery);
  private graphCanvas?: LGraphCanvas;

  ngOnDestroy(): void {
    this.containerSize$.complete();

    if (this.graphCanvas != null) {
      LiteGraph.closeAllContextMenus(this.graphCanvas.getCanvasWindow());
    }
  }

  ngAfterViewInit(): void {
    this.canvasQueryChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
      filter((x): x is ElementRef<HTMLCanvasElement> => !!x),
      map(x => x.nativeElement),
      take(1)
    ).subscribe(el => {
      this.translatorService.getTranslator('ai-graph/graph-editor').pipe(
        take(1),
        subscribeOn(asyncScheduler)
      ).subscribe(translator => {
        this.initLiteGraph(el, translator);
      });
    });
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      const pixels: ContentSize = {
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      };

      const dpr = window.devicePixelRatio;

      this.containerSize$.next(
        {
          css: pixels,
          canvas: {
            height: pixels.height * dpr,
            width: pixels.width * dpr,
          }
        }
      );
      setTimeout(() => {
        this.graphCanvas?.draw(true, true);
      });
    });
  }

  protected nodePropertiesEditorVisibilityChanged(visible: boolean): void {
    if (!visible) {
      this.nodeToEdit = null;
    }
  }

  protected showRunMenu(): void {
    this.nodePropertiesEditorVisibilityChanged(false);
    this.isRunMenuVisible = true;
  }

  private initLiteGraph(canvas: HTMLCanvasElement, translator: TranslatorFn): void {
    LiteGraph.use_uuids = true;
    NodesRegister.fillLGraphRegistration();

    const graph = new LGraph();
    this.graphCanvas = new LGraphCanvas(canvas, graph);
    this.graphCanvas.show_info = false;
    this.graphCanvas.allow_searchbox = false;

    graph.onNodeAdded = (node): void => {
      const targetNode = node as NodeBase;
      // this callback is invoked when node.title has default value
      targetNode.title = translator(['nodes', node.title, 'title'], {fallback: node.title});

      targetNode.inputs.forEach(input => {
        if (targetNode.getInputSlotLocalizedLabel) {
          input.localized_name = targetNode.getInputSlotLocalizedLabel(input, translator);
        } else {
          input.localized_name = translator(['slots', input.name, 'name'], {fallback: undefined});
        }
      });

      targetNode.outputs.forEach(output => {
        if (targetNode.getOutputSlotLocalizedLabel) {
          output.localized_name = targetNode.getOutputSlotLocalizedLabel(output, translator);
        } else {
          output.localized_name = translator(['slots', output.name, 'name'], {fallback: undefined});
        }
      });

      for (const propertyKey in node.properties) {
        const info = targetNode.getPropertyInfo(propertyKey) as NodePropertyInfo;
        if (targetNode.getPropertyLocalizedLabel) {
          info.label = targetNode.getPropertyLocalizedLabel(propertyKey, translator);
        } else {
          info.label = translator(['slots', propertyKey, 'name'], {fallback: propertyKey});
        }
      }
    };

    const initialConfig = this.initialConfig();
    if (initialConfig != null) {
      graph.configure(this.fromConfig(initialConfig), false);
    }

    this.currentConfig = this.toConfig(graph.asSerialisable());

    graph.onAfterChange = (updated): void => {
      this.currentConfig = this.toConfig(updated.asSerialisable());
      this.updateConfig.emit(this.currentConfig);
      this.runStatus = null;
    };

    this.graphCanvas.processContextMenu = (node, event): void => this.processContextMenu(node, event, translator);
    this.graphCanvas.onNodeDblClicked = (node: LGraphNode): void => {
      this.showNodePropertiesEditor(node as NodeBase);
    };
  }

  private toConfig(graph: SerialisableGraph): GraphConfig {
    return LiteGraphModelsConverter.toGraphConfig(graph);
  }

  private fromConfig(config: GraphConfig): SerialisableGraph {
    return LiteGraphModelsConverter.toSerialisableGraph(config);
  }

  private processContextMenu(
    node: LGraphNode | null,
    event: CanvasMouseEvent,
    translator: TranslatorFn): void {
    const options: IContextMenuOptions = {
      event: event,
      extra: node
    };

    if (node != null) {
      const targetNode = node as NodeBase;

      const slot = node.getSlotInPosition(event.canvasX, event.canvasY);
      if (slot != null) {
        const slotMenu = targetNode.getSlotMenu(slot, translator);
        if (slotMenu.items.length > 0) {
          options.title = slotMenu.title;
          new LiteGraph.ContextMenu(slotMenu.items, options);
        }

        return;
      }

      const nodeMenu = targetNode.getNodeMenu(
        translator,
        {
          editNodeProperties: selectedNode => {
            this.showNodePropertiesEditor(selectedNode);
          }
        }
      );
      if (nodeMenu.items.length > 0) {
        options.title = nodeMenu.title;
        new LiteGraph.ContextMenu(nodeMenu.items, options);
      }

      return;
    }

    const backgroundMenu = BackgroundMenuBuilder.getMenu(translator);
    if (backgroundMenu.items.length > 0) {
      options.title = backgroundMenu.title;
      new LiteGraph.ContextMenu(backgroundMenu.items, options);
    }
  }

  private showNodePropertiesEditor(node: NodeBase): void {
    if (!node.pinned) {
      this.nodeToEdit = node;
      this.isRunMenuVisible = false;
      this.cdr.markForCheck();
    }
  }
}
