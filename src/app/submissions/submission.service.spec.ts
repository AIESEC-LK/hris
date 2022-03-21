import { TestBed } from '@angular/core/testing';

import { SubmissionServiceService } from './submission-service.service';

describe('SubmissionServiceService', () => {
  let service: SubmissionServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubmissionServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
