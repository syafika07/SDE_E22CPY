import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddInfoPage } from '../../components/add-info.page';

describe('AddInfoPage', () => {
  let component: AddInfoPage;
  let fixture: ComponentFixture<AddInfoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
