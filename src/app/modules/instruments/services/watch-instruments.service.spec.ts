import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WebsocketService } from 'src/app/shared/services/websocket.service';

import { WatchInstrumentsService } from './watch-instruments.service';
import { TestData } from '../../../shared/utils/testing';
import { Instrument } from '../../../shared/models/instruments/instrument.model';

describe('WatchInstrumentsService', () => {
  let service: WatchInstrumentsService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;

  const spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);

  const toInstrumentsArray = (s: string) => !!s ? <Instrument[]> JSON.parse(s) : [];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        WatchInstrumentsService,
        { provide: WebsocketService, useValue: spy },
      ]
    });
    service = TestBed.inject(WatchInstrumentsService);
    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#add should update localStorage', (done) => {
    const newInstrument = TestData.instruments[0];

    spyOn(localStorage, 'setItem').and.callFake((key, value) => {
      const savedInstruments = toInstrumentsArray(value);

      expect(savedInstruments.length).toBeGreaterThan(0);
      expect(savedInstruments.find(x => x.isin === newInstrument.isin)).toBeDefined();
      done();
    }
    );

     service.add(newInstrument);
  });

  it('#remove should update localStorage', (done) => {
    const allInstruments = TestData.instruments;
    const instrumentToRemove = allInstruments[0];

    allInstruments.forEach(i => service.add(i));

    spyOn(localStorage, 'setItem').and.callFake((key, value) => {
      const updatedInstruments = toInstrumentsArray(value);

        expect(updatedInstruments.length).toEqual(allInstruments.length - 1);
        expect(updatedInstruments.find(x => x.isin === instrumentToRemove.isin)).toBeUndefined();

        done();
      }
    );

    service.remove(instrumentToRemove);
  });
});
