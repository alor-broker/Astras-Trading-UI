/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AuthService } from '../../../shared/services/auth.service';
import { PositionsService } from 'src/app/shared/services/positions.service';

describe('AccountService', () => {
  const spyAuth = jasmine.createSpyObj('AuthService', ['currentUser$']);
  const spyPositions = jasmine.createSpyObj('PositionsService', ['getAllByLogin']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: spyAuth },
        { provide: PositionsService, useValue: spyPositions }
      ]
    });
  });

  it('should ...', inject([AuthService], (service: AuthService) => {
    expect(service).toBeTruthy();
  }));
});
