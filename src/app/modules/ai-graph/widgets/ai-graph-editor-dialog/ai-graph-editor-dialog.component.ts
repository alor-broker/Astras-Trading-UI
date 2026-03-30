import { Component, model, OnInit, inject } from '@angular/core';
import {TranslocoDirective} from "@jsverse/transloco";
import {NzModalComponent, NzModalContentDirective} from "ng-zorro-antd/modal";
import {GraphStorageService} from "../../services/graph-storage.service";
import {combineLatest, map, Observable, shareReplay, take, tap} from 'rxjs';
import {Graph, GraphConfig} from "../../models/graph.model";
import {LetDirective} from "@ngrx/component";
import {GraphEditorComponent} from "../../components/graph-editor/graph-editor.component";
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-ai-graph-editor-dialog',
  imports: [
    TranslocoDirective,
    NzModalComponent,
    NzModalContentDirective,
    LetDirective,
    GraphEditorComponent
  ],
  templateUrl: './ai-graph-editor-dialog.component.html',
  styleUrl: './ai-graph-editor-dialog.component.less'
})
export class AiGraphEditorDialogComponent implements OnInit {
  private readonly graphStorageService = inject(GraphStorageService);

  targetGraph$!: Observable<Graph | null>;
  protected latestVersion: GraphConfig | null = null;

  readonly targetGraphId = model<string | null>();
  private readonly targetGraphIdChanges = toObservable(this.targetGraphId);

  closeDialog(): void {
    this.targetGraph$.pipe(
      take(1)
    ).subscribe(g => {
      if (g != null && this.latestVersion != null) {
        this.saveChanges(g, this.latestVersion);
      }

      this.targetGraphId.set(null);
    });
  }

  ngOnInit(): void {
    this.targetGraph$ = combineLatest({
      targetGraphId: this.targetGraphIdChanges,
      allGraphs: this.graphStorageService.getAllGraphs()
    }).pipe(
      map(x => {
        if (x.targetGraphId == null) {
          return null;
        }

        return x.allGraphs.find(i => i.id === x.targetGraphId) ?? null;
      }),
      tap(() => this.latestVersion = null),
      shareReplay(1)
    );
  }

  private saveChanges(targetGraph: Graph, updatedConfig: GraphConfig): void {
    this.graphStorageService.addUpdateGraph({
      ...targetGraph,
      config: updatedConfig
    });
  }
}
