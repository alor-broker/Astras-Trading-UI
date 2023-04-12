import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RibbonComponent} from './ribbon.component';
import {mockComponent} from "../../../../shared/utils/testing";

describe('RibbonComponent', () => {
  let component: RibbonComponent;
  let fixture: ComponentFixture<RibbonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        RibbonComponent,
        mockComponent({selector: 'ats-scrollable-row'}),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RibbonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
