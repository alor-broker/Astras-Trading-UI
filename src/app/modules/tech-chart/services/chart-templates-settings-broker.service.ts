import { Injectable, inject } from '@angular/core';
import { RemoteStorageService } from "../../../shared/services/settings-broker/remote-storage.service";
import {
  combineLatest,
  forkJoin,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  ChartTemplate,
  ChartTemplateContent
} from "../../../../assets/charting_library";
import { ApplicationMetaService } from "../../../shared/services/application-meta.service";
import { map } from "rxjs/operators";
import { GuidGenerator } from "../../../shared/utils/guid";

export interface SavedTemplate extends ChartTemplate {
  templateName: string;
  templateId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChartTemplatesSettingsBrokerService {
  private readonly remoteStorageService = inject(RemoteStorageService);
  private readonly applicationMetaService = inject(ApplicationMetaService);

  private savedTemplates$: Observable<SavedTemplate[]> | null = null;

  private get groupKey(): string {
    return 'tv-chart-templates';
  }

  removeTemplate(templateName: string): Observable<void> {
    return this.getSavedTemplates().pipe(
      switchMap(t => {
        const targetTemplate = t.find(x => x.templateName === templateName);
        if (targetTemplate) {
          return this.remoteStorageService.removeRecord(targetTemplate.templateId);
        }

        return of(false);
      }),
      map(() => void 0),
      tap(() => {
        // set to null to refresh saved templates
        this.savedTemplates$ = null;
      }),
      take(1)
    );
  }

  saveChartTemplate(templateName: string, template: ChartTemplateContent): Observable<void> {
    return this.getSavedTemplates().pipe(
      switchMap(t => {
        const targetTemplate = t.find(x => x.templateName === templateName);
        const templateId = targetTemplate?.templateId ?? GuidGenerator.newGuid();

        return this.remoteStorageService.setRecord(
          {
            key: templateId,
            meta: {
              timestamp: Date.now()
            },
            value: {
              templateName,
              content: template
            } as SavedTemplate
          },
          this.groupKey
        );
      }),
      map(() => void 0),
      tap(() => {
        // set to null to refresh saved templates
        this.savedTemplates$ = null;
      }),
      take(1)
    );
  }

  getSavedTemplates(): Observable<SavedTemplate[]> {
    this.savedTemplates$ ??= this.initSavedTemplatesStream();

    return this.savedTemplates$;
  }

  private initSavedTemplatesStream(): Observable<SavedTemplate[]> {
    const records$ = this.remoteStorageService.getGroup(this.groupKey).pipe(
      take(1)
    );

    return combineLatest({
      applicationMeta: this.applicationMetaService.getMeta(),
      records: records$
    }).pipe(
      switchMap(x => {
          if (x.records == null) {
            return of([]);
          }

          const validRecords = x.records
            .filter(r => x.applicationMeta.lastResetTimestamp == null || r.meta.timestamp > x.applicationMeta.lastResetTimestamp)
            .map(r => ({
              ...r.value as SavedTemplate,
              templateId: r.key
            }));

          if (validRecords.length === x.records.length) {
            return of(validRecords);
          }

          const obsoleteRecords = x.records.filter(r => x.applicationMeta.lastResetTimestamp != null && r.meta.timestamp <= x.applicationMeta.lastResetTimestamp);

          return forkJoin(
            obsoleteRecords.map(o => this.remoteStorageService.removeRecord(o.key))
          ).pipe(
            map(() => validRecords)
          );
        }
      ),
      take(1),
      shareReplay(1)
    );
  }
}
