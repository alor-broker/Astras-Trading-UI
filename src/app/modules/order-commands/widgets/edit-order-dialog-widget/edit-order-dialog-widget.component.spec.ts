import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { EditOrderDialogWidgetComponent } from './edit-order-dialog-widget.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {MockProvider} from "ng-mocks";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";

describe('EditOrderDialogWidgetComponent', () => {
  let component: EditOrderDialogWidgetComponent;
  let fixture: ComponentFixture<EditOrderDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      providers: [
        MockProvider(ConfirmableOrderCommandsService)
      ],
      declarations: [EditOrderDialogWidgetComponent]
    });
    fixture = TestBed.createComponent(EditOrderDialogWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
