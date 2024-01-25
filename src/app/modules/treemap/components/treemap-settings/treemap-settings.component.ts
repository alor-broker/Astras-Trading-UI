import {
  Component,
  OnInit
} from '@angular/core';
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
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
import { TreemapSettings } from "../../models/treemap.model";

@Component({
  selector: 'ats-treemap-settings',
  templateUrl: './treemap-settings.component.html',
  styleUrls: ['./treemap-settings.component.less']
})
export class TreemapSettingsComponent extends WidgetSettingsBaseComponent<TreemapSettings> implements OnInit {
  readonly validation = {
    refreshIntervalSec: {
      min: 30,
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
  protected settings$!: Observable<TreemapSettings>;

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

  protected getUpdatedSettings(): Partial<TreemapSettings> {
    return {
      refreshIntervalSec: this.form.value.refreshIntervalSec!
    };
  }

}
