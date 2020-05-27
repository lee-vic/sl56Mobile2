import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnreadMessageList1Page } from './unread-message-list1.page';

describe('UnreadMessageList1Page', () => {
  let component: UnreadMessageList1Page;
  let fixture: ComponentFixture<UnreadMessageList1Page>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnreadMessageList1Page ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnreadMessageList1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
