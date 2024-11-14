import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WidgetsGalleryNavBtnComponent} from './widgets-gallery-nav-btn.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponent, MockProvider} from "ng-mocks";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {WidgetsMetaService} from "../../../../shared/services/widgets-meta.service";
import {EMPTY} from "rxjs";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {provideHttpClient} from "@angular/common/http";
import {WidgetsGalleryComponent} from "../widgets-gallery/widgets-gallery.component";

describe('WidgetsGalleryNavBtnComponent', () => {
  let component: WidgetsGalleryNavBtnComponent;
  let fixture: ComponentFixture<WidgetsGalleryNavBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        WidgetsGalleryNavBtnComponent,
        TranslocoTestsModule.getModule(),
        MockComponent(WidgetsGalleryComponent)
      ],
      providers: [
        MockProvider(ManageDashboardsService),
        MockProvider(
          WidgetsMetaService,
          {
            getWidgetsMeta: () => EMPTY
          }
        ),
        MockProvider(
          TranslatorService,
          {
            getLangChanges: () => EMPTY
          }
        ),
        provideHttpClient()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetsGalleryNavBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
