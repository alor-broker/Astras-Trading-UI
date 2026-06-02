import {TestBed} from '@angular/core/testing';
import {EventsBusService} from './events-bus.service';
import {StoredEvent} from './events-bus-service.types';

describe('EventsBusService', () => {
  let service: EventsBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventsBusService]
    });

    service = TestBed.inject(EventsBusService);
  });

  it('should deliver a published event to a matching subscriber', () => {
    const received: StoredEvent[] = [];
    const sub = service.subscribe(e => e.key === 'login').subscribe(e => received.push(e));

    service.publish({key: 'login', payload: {userId: 1}});

    sub.unsubscribe();
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({key: 'login', payload: {userId: 1}});
  });

  it('should not deliver events that do not satisfy the predicate', () => {
    const received: StoredEvent[] = [];
    const sub = service.subscribe(e => e.key === 'login').subscribe(e => received.push(e));

    service.publish({key: 'logout'});

    sub.unsubscribe();
    expect(received).toHaveLength(0);
  });

  it('should attach a numeric timestamp to published events', () => {
    let received: StoredEvent | undefined;
    const sub = service.subscribe(() => true).subscribe(e => received = e);

    service.publish({key: 'tick'});

    sub.unsubscribe();
    expect(typeof received?.timestamp).toBe('number');
  });

  it('should not replay events published before a subscription', () => {
    service.publish({key: 'early'});

    const received: StoredEvent[] = [];
    const sub = service.subscribe(() => true).subscribe(e => received.push(e));
    sub.unsubscribe();

    expect(received).toHaveLength(0);
  });
});
