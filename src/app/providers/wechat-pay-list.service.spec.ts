import { TestBed } from '@angular/core/testing';

import { WechatPayListService } from './wechat-pay-list.service';

describe('WechatPayListService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WechatPayListService = TestBed.get(WechatPayListService);
    expect(service).toBeTruthy();
  });
});
