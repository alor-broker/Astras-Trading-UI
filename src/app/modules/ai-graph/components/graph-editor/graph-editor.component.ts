import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import {GraphConfig} from "../../models/graph.model";
import {LGraph, LGraphCanvas, LGraphNode, LiteGraph} from '@comfyorg/litegraph';
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {asyncScheduler, BehaviorSubject, subscribeOn, take} from "rxjs";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {LetDirective} from "@ngrx/component";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {IContextMenuOptions} from "@comfyorg/litegraph/dist/interfaces";
import {SerialisableGraph} from "@comfyorg/litegraph/dist/types/serialisation";
import {LiteGraphModelsConverter} from "../../graph/lite-graph-models-converter";
import {NodesRegister} from '../../graph/nodes/nodes-register';
import {NodePropertyInfo} from "../../graph/nodes/models";
import {NodeBase} from "../../graph/nodes/node-base";
import {CanvasMouseEvent} from "@comfyorg/litegraph/dist/types/events";
import {BackgroundMenuBuilder} from "../../graph/menu/background-menu-builder";
import {SideMenuComponent} from "../side-menu/side-menu.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {SideMenuTitleDirective} from "../../directives/side-menu-title.directive";
import {SideMenuContentDirective} from "../../directives/side-menu-content.directive";
import {TranslocoDirective} from "@jsverse/transloco";
import {filter, map, startWith} from "rxjs/operators";
import {RunConfigBtnComponent} from "../run-config-btn/run-config-btn.component";
import {RunStatus} from "../../models/run-results.model";
import {RunResultsComponent} from "../run-results/run-results.component";

@Component({
  selector: 'ats-graph-editor',
  standalone: true,
  imports: [
    NzResizeObserverDirective,
    LetDirective,
    SideMenuComponent,
    NzIconDirective,
    SideMenuTitleDirective,
    SideMenuContentDirective,
    TranslocoDirective,
    RunConfigBtnComponent,
    RunResultsComponent
  ],
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.less'
})
export class GraphEditorComponent implements AfterViewInit, OnDestroy {
  @Input()
  initialConfig: GraphConfig | null = null;

  @Output()
  updateConfig = new EventEmitter<GraphConfig>();

  @ViewChildren('canvas')
  canvasQuery!: QueryList<ElementRef<HTMLCanvasElement>>;

  isMenuVisible = false;

  runStatus: RunStatus | null = null;

  protected containerSize$ = new BehaviorSubject<ContentSize>({height: 100, width: 100});
  protected currentConfig: GraphConfig | null = null;
  protected isRightSideMenuVisible = false;
  private graphCanvas?: LGraphCanvas;

  constructor(
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnDestroy(): void {
    this.containerSize$.complete();

    if (this.graphCanvas != null) {
      LiteGraph.closeAllContextMenus(this.graphCanvas.getCanvasWindow());
    }
  }

  ngAfterViewInit(): void {
    this.canvasQuery.changes.pipe(
      map(x => x.first as ElementRef<HTMLCanvasElement> | undefined),
      startWith(this.canvasQuery.first),
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
      this.containerSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
      setTimeout(() => {
        this.graphCanvas?.draw(true, true);
      });
    });
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
          info.label = translator(['slots', propertyKey, 'name'], {fallback: info.label});
        }
      }
    };

    if (this.initialConfig != null) {
      graph.configure(this.fromConfig(this.initialConfig), false);
    }

    this.currentConfig = this.toConfig(graph.asSerialisable());

    graph.onAfterChange = (updated): void => {
      this.currentConfig = this.toConfig(updated.asSerialisable());
      this.updateConfig.emit(this.currentConfig);
      this.runStatus = null;
    };

    this.graphCanvas.processContextMenu = (node, event): void => this.processContextMenu(node, event, translator);
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

      const nodeMenu = targetNode.getNodeMenu(translator);
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
}
