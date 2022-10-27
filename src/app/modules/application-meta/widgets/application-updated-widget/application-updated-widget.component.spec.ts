import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationUpdatedWidgetComponent } from './application-updated-widget.component';
import { of } from 'rxjs';
import { ModalService } from '../../../../shared/services/modal.service';
import { ApplicationMetaModule } from '../../application-meta.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ApplicationMetaService } from '../../services/application-meta.service';

describe('ApplicationUpdatedWidgetComponent', () => {
  let component: ApplicationUpdatedWidgetComponent;
  let fixture: ComponentFixture<ApplicationUpdatedWidgetComponent>;

  let applicationMetaServiceSpy: any;

  beforeEach(() => {
    applicationMetaServiceSpy = jasmine.createSpyObj('ApplicationMetaService', ['updateCurrentVersion']);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplicationMetaModule,
        NoopAnimationsModule
      ],
      providers: [
        {
          provide: ModalService,
          useValue: {
            shouldShowApplicationUpdatedModal$: of(true)
          }
        },
        {
          provide: ApplicationMetaService,
          useValue: applicationMetaServiceSpy
        },
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationUpdatedWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
