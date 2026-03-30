import {ComponentFixture, TestBed} from '@angular/core/testing';
import {OptionPreviewComponent} from "./option-preview.component";
import {Option} from "../../models/option-board.model";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('OptionPreviewComponent', () => {
  let component: OptionPreviewComponent;
  let fixture: ComponentFixture<OptionPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        OptionPreviewComponent
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OptionPreviewComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'option',
      {
        calculations: {}
      } as Option
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
