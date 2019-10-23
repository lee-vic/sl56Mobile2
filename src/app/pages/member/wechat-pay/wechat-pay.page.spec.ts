import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WechatPayPage } from './wechat-pay.page';

describe('WechatPayPage', () => {
  let component: WechatPayPage;
  let fixture: ComponentFixture<WechatPayPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WechatPayPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WechatPayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
