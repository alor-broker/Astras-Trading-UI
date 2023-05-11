import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrationExtensionTableComponent } from './arbitration-extension-table.component';
import { ArbitrationExtensionService } from "../../services/arbitration-extension.service";
import { of } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { commonTestProviders, getTranslocoModule, sharedModuleImportForTests } from "../../../../shared/utils/testing";

describe('ArbitrationExtensionTableComponent', () => {
  let component: ArbitrationExtensionTableComponent;
  let fixture: ComponentFixture<ArbitrationExtensionTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArbitrationExtensionTableComponent ],
      imports: [...sharedModuleImportForTests, getTranslocoModule()],
      providers: [
        {
          provide: ArbitrationExtensionService,
          useValue: {
            getExtensionsSubscription: jasmine.createSpy('getExtensionsSubscription').and.returnValue(of([])),
            removeExtension: jasmine.createSpy('removeExtension').and.callThrough(),
            buyExtension: jasmine.createSpy('buyExtension').and.returnValue({}),
          }
        },
        {
          provide: ModalService,
          useValue: {
            openExtensionModal: jasmine.createSpy('openExtensionModal').and.callThrough(),
          }
        },
        ...commonTestProviders
  ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrationExtensionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
