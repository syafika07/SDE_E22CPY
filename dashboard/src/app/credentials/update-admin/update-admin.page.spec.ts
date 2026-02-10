import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateAdminPage } from './update-admin.page';

describe('UpdateAdminPage', () => {
  let component: UpdateAdminPage;
  let fixture: ComponentFixture<UpdateAdminPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateAdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
