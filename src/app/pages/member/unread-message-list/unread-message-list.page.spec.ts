import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnreadMessageListPage } from './unread-message-list.page';

describe('UnreadMessageListPage', () => {
  let component: UnreadMessageListPage;
  let fixture: ComponentFixture<UnreadMessageListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnreadMessageListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnreadMessageListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
