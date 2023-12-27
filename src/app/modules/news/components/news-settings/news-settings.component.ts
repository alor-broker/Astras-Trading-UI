import {
  Component,
  OnInit
} from '@angular/core';
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { NewsSettings } from "../../models/news-settings.model";
import {
  Observable,
  take
} from 'rxjs';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { NzMarks } from "ng-zorro-antd/slider";

@Component({
  selector: 'ats-news-settings',
  templateUrl: './news-settings.component.html',
  styleUrls: ['./news-settings.component.less']
})
export class NewsSettingsComponent extends WidgetSettingsBaseComponent<NewsSettings> implements OnInit {
  protected settings$!: Observable<NewsSettings>;
  readonly validation = {
    refreshIntervalSec: {
      min: 5,
      max: 600
    }
  };

  readonly marks: NzMarks = {
    [this.validation.refreshIntervalSec.min]: this.validation.refreshIntervalSec.min.toString(),
    [this.validation.refreshIntervalSec.max]: this.validation.refreshIntervalSec.max.toString(),
  };

  form = this.formBuilder.group({
    refreshIntervalSec: this.formBuilder.nonNullable.control(
      60,
      {
        validators: [
          Validators.required,
          Validators.min(this.validation.refreshIntervalSec.min),
          Validators.max(this.validation.refreshIntervalSec.max)
        ]
      }
    )
  });

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    private readonly formBuilder: FormBuilder
  ) {
    super(settingsService, manageDashboardsService);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.form.controls.refreshIntervalSec.setValue(settings.refreshIntervalSec ?? 60);
    });
  }

  protected getUpdatedSettings(): Partial<NewsSettings> {
    return {
      refreshIntervalSec: this.form.value.refreshIntervalSec!
    };
  }

}
