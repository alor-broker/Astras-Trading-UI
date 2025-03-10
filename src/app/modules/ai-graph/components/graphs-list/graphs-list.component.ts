import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {combineLatest, Observable, take} from "rxjs";
import {LetDirective} from "@ngrx/component";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzInputDirective, NzInputGroupComponent} from "ng-zorro-antd/input";
import {TranslocoDirective} from "@jsverse/transloco";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {NzFormControlComponent, NzFormDirective} from "ng-zorro-antd/form";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {GraphStorageService} from "../../services/graph-storage.service";
import {Graph} from "../../models/graph.model";
import {GuidGenerator} from "../../../../shared/utils/guid";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {NzEmptyComponent} from "ng-zorro-antd/empty";

@Component({
  selector: 'ats-graphs-list',
  standalone: true,
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
    NzEmptyComponent
  ],
  templateUrl: './graphs-list.component.html',
  styleUrl: './graphs-list.component.less'
})
export class GraphsListComponent implements OnInit {
  readonly validationOptions = {
    graphTitle: {
      max: 50
    }
  };

  isLoading = false;
  $graphs!: Observable<Graph[]>;

  readonly newGraphTitleControl = this.formBuilder.nonNullable.control(
    '',
    {
      validators: [
        Validators.required,
        Validators.maxLength(this.validationOptions.graphTitle.max)
      ]
    }
  );

  @Output()
  editGraph = new EventEmitter<string>();

  constructor(
    private readonly graphStorageService: GraphStorageService,
    private readonly formBuilder: FormBuilder,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.$graphs = this.graphStorageService.getAllGraphs();
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

  remove(id: string): void {
    this.graphStorageService.removeGraph(id);
  }

  private resetNewGraphTitleControl(): void {
    combineLatest({
      graphs: this.$graphs,
      translator: this.translatorService.getTranslator('ai-graph/graphs-list')
    }).pipe(
      take(1)
    ).subscribe(x => {
      this.newGraphTitleControl.reset(x.translator(['newGraphTitleTemplate'], {number: x.graphs.length + 1}));
    });
  }
}
