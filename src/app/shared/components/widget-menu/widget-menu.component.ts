import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {WidgetsMetaService} from "../../services/widgets-meta.service";
import {combineLatest, Observable, shareReplay} from "rxjs";
import {map} from "rxjs/operators";
import {TranslatorService} from "../../services/translator.service";
import {WidgetsHelper} from "../../utils/widgets";

interface WidgetDisplay {
  typeId: string;
  icon: string;
  name: string;
}

@Component({
  selector: 'ats-widget-menu',
  templateUrl: './widget-menu.component.html',
  styleUrls: ['./widget-menu.component.less']
})
export class WidgetMenuComponent implements OnInit {
  @Input() public showResetItem = false;
  @Output() public selected = new EventEmitter<string>();
  @Output() public resetDashboard = new EventEmitter<void>();

  widgetsMeta$!: Observable<WidgetDisplay[]>;

  constructor(
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.widgetsMeta$ = combineLatest([
        this.widgetsMetaService.getWidgetsMeta(),
        this.translatorService.getLangChanges()
      ]
    ).pipe(
      map(([meta, lang]) => meta
        .filter(x => !!x.desktopMeta && x.desktopMeta.enabled)
        .sort((a, b) => {
            return (a.desktopMeta?.galleryOrder ?? 0) - (b.desktopMeta?.galleryOrder ?? 0);
          }
        )
        .map(x => ({
          typeId: x.typeId,
          name: WidgetsHelper.getWidgetName(x.widgetName, lang),
          icon: x.desktopMeta?.galleryIcon ?? 'appstore'
        }))
      ),
      shareReplay(1)
    );
  }
}
