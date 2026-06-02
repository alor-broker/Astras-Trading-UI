import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';
import {NavigationStackService} from './navigation-stack.service';
import {NavigationState} from './navigation-stack-service.types';

describe('NavigationStackService', () => {
  let service: NavigationStackService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NavigationStackService]
    });

    service = TestBed.inject(NavigationStackService);
  });

  function createState(typeId: string, isFinal = false): NavigationState {
    return {isFinal, widgetTarget: {typeId}};
  }

  it('should expose the pushed state as the current state', async () => {
    const state = createState('widget-a');
    service.pushState(state);

    expect(await firstValueFrom(service.currentState$)).toEqual(state);
  });

  it('should keep the most recently pushed state as current', async () => {
    const first = createState('widget-a');
    const second = createState('widget-b');
    service.pushState(first);
    service.pushState(second);

    expect(await firstValueFrom(service.currentState$)).toEqual(second);
  });

  it('should return to the previous state after popState', async () => {
    const first = createState('widget-a');
    const second = createState('widget-b');
    service.pushState(first);
    service.pushState(second);

    service.popState();

    expect(await firstValueFrom(service.currentState$)).toEqual(first);
  });

  it('should not pop a state that is marked as final', async () => {
    const finalState = createState('widget-final', true);
    service.pushState(finalState);

    service.popState();

    expect(await firstValueFrom(service.currentState$)).toEqual(finalState);
  });
});
