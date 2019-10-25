import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WechatBindingPage } from './wechat-binding.page';

describe('WechatBindingPage', () => {
  let component: WechatBindingPage;
  let fixture: ComponentFixture<WechatBindingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WechatBindingPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WechatBindingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
