import { TestBed } from '@angular/core/testing';

import { WechatPayService } from './wechat-pay.service';

describe('WechatPayService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WechatPayService = TestBed.get(WechatPayService);
    expect(service).toBeTruthy();
  });
});
