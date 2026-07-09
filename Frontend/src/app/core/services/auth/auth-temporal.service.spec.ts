import { TestBed } from '@angular/core/testing';

import { AuthTemporalService } from './auth-temporal.service';

describe('AuthTemporalService', () => {
  let service: AuthTemporalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthTemporalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
