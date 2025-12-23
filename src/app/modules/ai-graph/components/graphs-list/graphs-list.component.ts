import { Component, OnInit, output, inject } from '@angular/core';
import {combineLatest, Observable, take} from "rxjs";
import {LetDirective} from "@ngrx/component";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {
  NzButtonComponent,
} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzInputDirective, NzInputGroupComponent} from "ng-zorro-antd/input";
import {TranslocoDirective} from "@jsverse/transloco";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {NzFormControlComponent, NzFormDirective} from "ng-zorro-antd/form";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {GraphStorageService} from "../../services/graph-storage.service";
import {
  Graph,
  GraphConfig
} from "../../models/graph.model";
import {GuidGenerator} from "../../../../shared/utils/guid";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import { GraphTemplatesStorageService } from "../../services/graph-templates-storage.service";
import { GraphTemplate } from "../../models/graph-template.model";
import {
  NzDropDownDirective,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import { NzSpaceCompactComponent } from "ng-zorro-antd/space";
import {
  NzMenuDirective,
  NzMenuItemComponent
} from "ng-zorro-antd/menu";
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";

@Component({
    selector: 'ats-graphs-list',
  imports: [
    LetDirective,
    NzSpinComponent,
    NzButtonComponent,
    NzIconDirective,
    NzInputGroupComponent,
    NzInputDirective,
    TranslocoDirective,
    ReactiveFormsModule,
    NzFormControlComponent,
    NzFormDirective,
    NzPopconfirmDirective,
    NzEmptyComponent,
    NzDropDownDirective,
    NzSpaceCompactComponent,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzTooltipDirective
  ],
    templateUrl: './graphs-list.component.html',
    styleUrl: './graphs-list.component.less'
})
export class GraphsListComponent implements OnInit {
  private readonly graphStorageService = inject(GraphStorageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly translatorService = inject(TranslatorService);
  private readonly graphTemplatesStorageService = inject(GraphTemplatesStorageService);

  readonly validationOptions = {
    graphTitle: {
      max: 50
    }
  };

  isLoading = false;
  graphs$!: Observable<Graph[]>;
  templates$!: Observable<GraphTemplate[]>;

  readonly newGraphTitleControl = this.formBuilder.nonNullable.control(
    '',
    {
      validators: [
        Validators.required,
        Validators.maxLength(this.validationOptions.graphTitle.max)
      ]
    }
  );

  readonly editGraph = output<string>();

  ngOnInit(): void {
    this.graphs$ = this.graphStorageService.getAllGraphs();
    this.templates$ = this.graphTemplatesStorageService.getAllTemplates();
    this.resetNewGraphTitleControl();
  }

  addGraph(): void {
    if (this.newGraphTitleControl.valid) {
      const graph: Graph = {
        id: GuidGenerator.newGuid(),
        title: this.newGraphTitleControl.value,
        createdTimestamp: new Date().getTime()
      };

      this.graphStorageService.addUpdateGraph(graph);
      this.editGraph.emit(graph.id);
      this.resetNewGraphTitleControl();
    }
  }

  addGraphFromTemplate(template: GraphTemplate): void {
    if (this.newGraphTitleControl.valid) {
      const graph: Graph = {
        id: GuidGenerator.newGuid(),
        title: this.newGraphTitleControl.value,
        createdTimestamp: new Date().getTime(),
        config: JSON.parse(JSON.stringify(template.config)) as GraphConfig
      };

      this.graphStorageService.addUpdateGraph(graph);
      this.editGraph.emit(graph.id);
      this.resetNewGraphTitleControl();
    }
  }

  remove(id: string): void {
    this.graphStorageService.removeGraph(id);
  }

  private resetNewGraphTitleControl(): void {
    combineLatest({
      graphs: this.graphs$,
      translator: this.translatorService.getTranslator('ai-graph/graphs-list')
    }).pipe(
      take(1)
    ).subscribe(x => {
      this.newGraphTitleControl.reset(x.translator(['newGraphTitleTemplate'], {number: x.graphs.length + 1}));
    });
  }
}
