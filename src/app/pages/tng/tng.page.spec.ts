import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TngPage } from './tng.page';

describe('TngPage', () => {
  let component: TngPage;
  let fixture: ComponentFixture<TngPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TngPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
