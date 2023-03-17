import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreemapComponent } from './treemap.component';
import { TreemapService } from "../../services/treemap.service";
import { of } from "rxjs";
import { ThemeService } from "../../../../shared/services/theme.service";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { TranslatorService } from "../../../../shared/services/translator.service";

describe('TreemapComponent', () => {
  let component: TreemapComponent;
  let fixture: ComponentFixture<TreemapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TreemapComponent ],
      providers: [
        {
          provide: TreemapService,
          useValue: {
            getTreemap: jasmine.createSpy('getTreemap').and.returnValue(of([]))
          }
        },
        {
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(of({}))
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getLastQuoteInfo: jasmine.createSpy('getLastQuoteInfo').and.returnValue(of({}))
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => ''))
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreemapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
