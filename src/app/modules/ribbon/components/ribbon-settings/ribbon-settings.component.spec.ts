import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RibbonSettingsComponent} from "./ribbon-settings.component";
import {getTranslocoModule, ngZorroMockComponents} from "../../../../shared/utils/testing";

describe('QuotesRowSettingsComponent', () => {
  let component: RibbonSettingsComponent;
  let fixture: ComponentFixture<RibbonSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        RibbonSettingsComponent,
        ...ngZorroMockComponents
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RibbonSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
