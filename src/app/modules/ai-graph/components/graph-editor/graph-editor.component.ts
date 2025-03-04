import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild} from '@angular/core';
import {GraphConfig} from "../../models/graph.model";
import {LGraph, LGraphCanvas, LGraphNode, LiteGraph} from '@comfyorg/litegraph';
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {asyncScheduler, BehaviorSubject, subscribeOn, take} from "rxjs";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {LetDirective} from "@ngrx/component";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {IContextMenuOptions} from "@comfyorg/litegraph/dist/interfaces";
import {SerialisableGraph} from "@comfyorg/litegraph/dist/types/serialisation";
import {GraphRunnerPanelComponent} from "../graph-runner-panel/graph-runner-panel.component";
import {LiteGraphModelsConverter} from "../../graph/lite-graph-models-converter";
import {NodesRegister} from '../../graph/nodes/nodes-register';
import {NodePropertyInfo} from "../../graph/nodes/models";
import {NodeBase} from "../../graph/nodes/node-base";
import {CanvasMouseEvent} from "@comfyorg/litegraph/dist/types/events";
import {BackgroundMenuBuilder} from "../../graph/menu/background-menu-builder";

@Component({
  selector: 'ats-graph-editor',
  standalone: true,
  imports: [
    NzResizeObserverDirective,
    LetDirective,
    GraphRunnerPanelComponent
  ],
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.less'
})
export class GraphEditorComponent implements AfterViewInit, OnDestroy {
  @Input()
  initialConfig: GraphConfig | null = null;

  @Output()
  updateConfig = new EventEmitter<GraphConfig>();

  @ViewChild('canvas')
  canvas?: ElementRef<HTMLCanvasElement>;

  protected containerSize$ = new BehaviorSubject<ContentSize>({height: 1, width: 1});
  protected currentConfig: GraphConfig | null = null;
  private graphCanvas?: LGraphCanvas;

  constructor(private readonly translatorService: TranslatorService) {
  }

  ngOnDestroy(): void {
    this.containerSize$.complete();

    if (this.graphCanvas != null) {
      LiteGraph.closeAllContextMenus(this.graphCanvas.getCanvasWindow());
    }
  }

  ngAfterViewInit(): void {
    this.translatorService.getTranslator('ai-graph/graph-editor').pipe(
      take(1),
      subscribeOn(asyncScheduler)
    ).subscribe(translator => {
      this.initLiteGraph(translator);
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

  private initLiteGraph(translator: TranslatorFn): void {
    if (!this.canvas) {
      return;
    }

    LiteGraph.use_uuids = true;
    NodesRegister.fillLGraphRegistration();

    const graph = new LGraph();
    this.graphCanvas = new LGraphCanvas(this.canvas.nativeElement!, graph);
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
