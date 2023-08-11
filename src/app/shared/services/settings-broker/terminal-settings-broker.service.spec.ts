import { TestBed } from '@angular/core/testing';

import { TerminalSettingsBrokerService } from './terminal-settings-broker.service';
import {RemoteStorageService} from "./remote-storage.service";
import {Subject} from "rxjs";
import {LocalStorageService} from "../local-storage.service";

describe('TerminalSettingsBrokerService', () => {
  let service: TerminalSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RemoteStorageService,
          useValue: {
            getRecord: jasmine.createSpy('getRecord').and.returnValue(new Subject()),
            setRecord: jasmine.createSpy('setRecord').and.returnValue(new Subject())
          }
        },
        {
          provide: LocalStorageService,
          useValue: {
            getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            removeItem: jasmine.createSpy('removeItem').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(TerminalSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
