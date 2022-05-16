/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, inject } from '@angular/core/testing';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { AuthService } from './auth.service';

describe('AccountService', () => {
  const spyAuth = jasmine.createSpyObj('AuthService', ['currentUser$']);
  const spyPositions = jasmine.createSpyObj('PositionsService', ['getAllByLogin']);

  beforeEach(() => {
    let client: HttpClient;
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: spyAuth },
        { provide: PositionsService, useValue: spyPositions }
      ]
    });

    client = TestBed.inject(HttpClient);
  });

  it('should ...', inject([AuthService], (service: AuthService) => {
    expect(service).toBeTruthy();
  }));
});
