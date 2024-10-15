import { TestBed } from '@angular/core/testing';

import { WidgetLocalStateService } from './widget-local-state.service';
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { WidgetsLocalStatesFeature } from "../../store/widgets-local-state/widgets-local-state.reducer";
import { WidgetsLocalStateEffects } from "../../store/widgets-local-state/widgets-local-state.effects";
import { commonTestProviders } from "../utils/testing/common-test-providers";

describe('WidgetLocalStateService', () => {
  let service: WidgetLocalStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(WidgetsLocalStatesFeature),
        EffectsModule.forFeature([WidgetsLocalStateEffects])
      ],
      providers: [
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(WidgetLocalStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
