import { TestBed } from '@angular/core/testing';

import { WechatBindingService } from './wechat-binding.service';

describe('WechatBindingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WechatBindingService = TestBed.get(WechatBindingService);
    expect(service).toBeTruthy();
  });
});
