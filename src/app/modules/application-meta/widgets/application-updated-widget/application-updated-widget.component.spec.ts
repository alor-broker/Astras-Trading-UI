import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ApplicationUpdatedWidgetComponent} from './application-updated-widget.component';
import {of} from 'rxjs';
import {ModalService} from '../../../../shared/services/modal.service';
import {ApplicationMetaService} from '../../services/application-meta.service';
import {MockComponents, MockDirectives} from "ng-mocks";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzModalComponent, NzModalContentDirective} from "ng-zorro-antd/modal";
import {NzDividerComponent} from "ng-zorro-antd/divider";
import {NzCollapseComponent, NzCollapsePanelComponent} from "ng-zorro-antd/collapse";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

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
        ApplicationUpdatedWidgetComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          NzModalComponent,
          NzDividerComponent,
          NzCollapseComponent,
          NzCollapsePanelComponent,
          NzTypographyComponent,
        ),
        MockDirectives(
          TranslocoDirective,
          NzModalContentDirective,
          NzIconDirective
        )
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
