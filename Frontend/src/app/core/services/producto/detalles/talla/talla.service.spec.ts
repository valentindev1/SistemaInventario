import { TestBed } from '@angular/core/testing';

import { TallaService } from './talla.service';

describe('TallaService', () => {
  let service: TallaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TallaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
