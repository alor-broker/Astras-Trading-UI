import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ArbitrageSpreadModalWidgetComponent } from './arbitrage-spread-modal-widget.component';
import { ModalService } from "../../../../shared/services/modal.service";
import {
  BehaviorSubject,
  of
} from "rxjs";
import { ArbitrageSpreadService } from "../../services/arbitrage-spread.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {NzModalComponent} from "ng-zorro-antd/modal";
import {
  ArbitrageSpreadManageComponent
} from "../../components/arbitrage-spread-manage/arbitrage-spread-manage.component";
import {NzButtonComponent} from "ng-zorro-antd/button";

describe('ArbitrageSpreadModalWidgetComponent', () => {
  let component: ArbitrageSpreadModalWidgetComponent;
  let fixture: ComponentFixture<ArbitrageSpreadModalWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
      TranslocoTestsModule.getModule(),
      ArbitrageSpreadModalWidgetComponent,
      MockComponents(
        NzModalComponent,
        ArbitrageSpreadManageComponent,
        NzButtonComponent
      )
    ],
    providers: [
        {
            provide: ModalService,
            useValue: {
                shouldShowExtensionModal$: new BehaviorSubject(false),
                extensionParams$: of(null),
                closeSpreadModal: jasmine.createSpy('closeSpreadModal').and.callThrough(),
            }
        },
        {
            provide: ArbitrageSpreadService,
            useValue: {
                editSpread: jasmine.createSpy('editSpread').and.callThrough(),
                addSpread: jasmine.createSpy('addSpread').and.callThrough(),
            }
        }
    ]
})
      .compileComponents();

    fixture = TestBed.createComponent(ArbitrageSpreadModalWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
