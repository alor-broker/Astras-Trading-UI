import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ApplicationUpdatedWidgetComponent } from './application-updated-widget.component';
import { of } from 'rxjs';
import { ModalService } from '../../../../shared/services/modal.service';
import { ApplicationMetaModule } from '../../application-meta.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ApplicationUpdatedWidgetComponent', () => {
  let component: ApplicationUpdatedWidgetComponent;
  let fixture: ComponentFixture<ApplicationUpdatedWidgetComponent>;

  let applicationMetaService: any;

  beforeEach(() => {
    applicationMetaService = jasmine.createSpyObj('ApplicationMetaService', ['updateCurrentVersion']);
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
        }
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
