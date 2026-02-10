import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeSuccessPage } from './change-success.page';

describe('ChangeSuccessPage', () => {
  let component: ChangeSuccessPage;
  let fixture: ComponentFixture<ChangeSuccessPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeSuccessPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
