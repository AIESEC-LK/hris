import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoStringInputDialogComponent } from './two-string-input-dialog.component';

describe('TwoStringInputDialogComponent', () => {
  let component: TwoStringInputDialogComponent;
  let fixture: ComponentFixture<TwoStringInputDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwoStringInputDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwoStringInputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
