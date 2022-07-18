import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { CommandsService } from './commands.service';
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { Store } from "@ngrx/store";
import { of } from "rxjs";

describe('CommandsService', () => {
  let service: CommandsService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;

  const notificationSpy = jasmine.createSpyObj('NzNotificationService', ['error', 'success']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        CommandsService,
        { provide: NzNotificationService, useValue: notificationSpy },
        { provide: ErrorHandlerService, useValue: jasmine.createSpyObj('ErrorHandlerService', ['handleError']) },
        { provide: Store, useValue: { select: jasmine.createSpy('select').and.returnValue(of({})) }}
      ]
    });
    service = TestBed.inject(CommandsService);
    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
