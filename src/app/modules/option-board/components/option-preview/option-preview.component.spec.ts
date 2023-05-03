import {ComponentFixture, TestBed} from '@angular/core/testing';
import {OptionPreviewComponent} from "./option-preview.component";
import {getTranslocoModule} from "../../../../shared/utils/testing";
import {Option} from "../../models/option-board.model";

describe('OptionPreviewComponent', () => {
  let component: OptionPreviewComponent;
  let fixture: ComponentFixture<OptionPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [OptionPreviewComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OptionPreviewComponent);
    component = fixture.componentInstance;

    component.option = {
      calculations: {

      }
    } as Option;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
