import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsLoadErrorDialogComponent } from './settings-load-error-dialog.component';
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { getTranslocoModule } from "../../../../shared/utils/testing";

describe('SettingsLoadErrorDialogComponent', () => {
  let component: SettingsLoadErrorDialogComponent;
  let fixture: ComponentFixture<SettingsLoadErrorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        SettingsLoadErrorDialogComponent
      ],
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            externalLinks: {
              support: ''
            }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsLoadErrorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
