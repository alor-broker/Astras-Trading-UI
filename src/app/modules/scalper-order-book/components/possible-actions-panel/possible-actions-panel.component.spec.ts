import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PossibleActionsPanelComponent} from './possible-actions-panel.component';
import {ScalperCommandProcessorService} from '../../services/scalper-command-processor.service';
import {Subject} from 'rxjs';
import {TranslatorService} from '../../../../shared/services/translator.service';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('PossibleActionsPanelComponent', () => {
  let component: PossibleActionsPanelComponent;
  let fixture: ComponentFixture<PossibleActionsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        PossibleActionsPanelComponent
      ],
      providers: [
        {
          provide: ScalperCommandProcessorService,
          useValue: {
            getPossibleActions: jasmine.createSpy('getPossibleActions').and.returnValue(new Subject())
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(() => {
            })
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PossibleActionsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
