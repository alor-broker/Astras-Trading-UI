import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WidgetMenuComponent} from './widget-menu.component';
import {getTranslocoModule, ngZorroMockComponents} from "../../utils/testing";
import {WidgetsMetaService} from "../../services/widgets-meta.service";
import {of} from "rxjs";

describe('WidgetMenuComponent', () => {
  let component: WidgetMenuComponent;
  let fixture: ComponentFixture<WidgetMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WidgetMenuComponent,
        ...ngZorroMockComponents
      ],
      imports: [getTranslocoModule()],
      providers: [
        {
          provide: WidgetsMetaService,
          useValue: {
            getWidgetsMeta: jasmine.createSpy('getWidgetsMeta').and.returnValue(of([]))
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
