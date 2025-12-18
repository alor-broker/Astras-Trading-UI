import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { EditOrderDialogWidgetComponent } from './edit-order-dialog-widget.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";
import {NzModalComponent, NzModalContentDirective} from "ng-zorro-antd/modal";
import {InstrumentInfoComponent} from "../../components/instrument-info/instrument-info.component";
import {
  EditLimitOrderFormComponent
} from "../../components/order-forms/edit-limit-order-form/edit-limit-order-form.component";
import {
  EditStopOrderFormComponent
} from "../../components/order-forms/edit-stop-order-form/edit-stop-order-form.component";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('EditOrderDialogWidgetComponent', () => {
  let component: EditOrderDialogWidgetComponent;
  let fixture: ComponentFixture<EditOrderDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [
      TranslocoTestsModule.getModule(),
      EditOrderDialogWidgetComponent,
      MockComponents(
        NzModalComponent,
        InstrumentInfoComponent,
        EditLimitOrderFormComponent,
        EditStopOrderFormComponent,
        NzTypographyComponent,
        NzButtonComponent
      ),
      MockDirectives(
        NzModalContentDirective,
        NzIconDirective
      )
    ],
    providers: [
        MockProvider(ConfirmableOrderCommandsService)
    ]
});
    fixture = TestBed.createComponent(EditOrderDialogWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
