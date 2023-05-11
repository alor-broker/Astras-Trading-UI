import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrationExtensionModalWidgetComponent } from './arbitration-extension-modal-widget.component';
import { ModalService } from "../../../../shared/services/modal.service";
import { BehaviorSubject, of } from "rxjs";
import { ArbitrationExtensionService } from "../../services/arbitration-extension.service";
import { getTranslocoModule, ngZorroMockComponents } from "../../../../shared/utils/testing";

describe('ArbitrationExtensionModalWidgetComponent', () => {
  let component: ArbitrationExtensionModalWidgetComponent;
  let fixture: ComponentFixture<ArbitrationExtensionModalWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ArbitrationExtensionModalWidgetComponent,
        ...ngZorroMockComponents
      ],
      imports: [ getTranslocoModule() ],
      providers: [
        {
          provide: ModalService,
          useValue: {
            shouldShowExtensionModal$: new BehaviorSubject(false),
            extensionParams$: of(null),
            closeExtensionModal: jasmine.createSpy('closeExtensionModal').and.callThrough(),
          }
        },
        {
          provide: ArbitrationExtensionService,
          useValue: {
            editExtension: jasmine.createSpy('editExtension').and.callThrough(),
            addExtension: jasmine.createSpy('addExtension').and.callThrough(),
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrationExtensionModalWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
