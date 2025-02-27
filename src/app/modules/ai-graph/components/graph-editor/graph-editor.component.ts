import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import {GraphConfig} from "../../models/graph.model";
import {IContextMenuValue, LGraphCanvas, LGraphNode, LiteGraph} from '@comfyorg/litegraph';
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {asyncScheduler, BehaviorSubject, subscribeOn, take} from "rxjs";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {LetDirective} from "@ngrx/component";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {IContextMenuOptions} from "@comfyorg/litegraph/dist/interfaces";
import {NodesRegister} from "../../editor/nodes/nodes-register";
import {SerialisableGraph} from "@comfyorg/litegraph/dist/types/serialisation";
import {LiteGraphModelsConverter} from "../../editor/lite-graph-models-converter";
import {GraphRunnerPanelComponent} from "../graph-runner-panel/graph-runner-panel.component";
import {AtsGraphCanvas} from "../../editor/graph-canvas";
import {Graph} from "../../editor/graph";

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

    const graph = new Graph();
    this.graphCanvas = new AtsGraphCanvas(this.canvas.nativeElement!, graph);
    this.graphCanvas.show_info = false;

    this.graphCanvas.getMenuOptions = (): IContextMenuValue[] => {
      const options: IContextMenuValue[] = [
        {
          content: translator(['canvasMenu', 'addNode']),
          callback: (value, options1, event, previousMenu): boolean => {
            return AtsGraphCanvas.onMenuAdd(null as unknown as LGraphNode, options1 as IContextMenuOptions, event as MouseEvent, previousMenu!);
          }
        }
      ];

      return options;
    };

    if(this.initialConfig != null) {
      graph.configure(this.fromConfig(this.initialConfig), false);
    }

    this.currentConfig = this.toConfig(graph.asSerialisable());
    graph.onAfterChange = (updated): void => {
      this.currentConfig = this.toConfig(updated.asSerialisable());
      this.updateConfig.emit(this.currentConfig);
    };
  }

  private toConfig(graph: SerialisableGraph): GraphConfig {
    return LiteGraphModelsConverter.toGraphConfig(graph);
  }

  private fromConfig(config: GraphConfig): SerialisableGraph {
    return LiteGraphModelsConverter.toSerialisableGraph(config);
  }
}
