/* tslint:disable:no-unused-variable */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  const spyAuth = jasmine.createSpyObj('AuthService', ['currentUser$']);
  const spyPositions = jasmine.createSpyObj('PositionsService', ['getAllByLogin']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        AccountService,
        { provide: AuthService, useValue: spyAuth },
        { provide: PositionsService, useValue: spyPositions }
      ]
    });

    service = TestBed.inject(AccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
