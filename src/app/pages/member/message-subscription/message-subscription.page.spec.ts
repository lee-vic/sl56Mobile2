import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';

import { MessageSubscriptionPage } from './message-subscription.page';

describe('MessageSubscriptionPage', () => {
  let component: MessageSubscriptionPage;
  let fixture: ComponentFixture<MessageSubscriptionPage>;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MessageSubscriptionPage],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageSubscriptionPage);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    fixture.detectChanges();
  });

  it('renders three subscription channels', () => {
    expect(component.items.length).toBe(3);
    expect(component.items[0].name).toBe('微信公众号消息');
    expect(component.items[1].name).toBe('短信消息');
    expect(component.items[2].name).toBe('邮件消息');
  });

  it('navigates to the selected channel member page', () => {
    spyOn(router, 'navigate');

    component.openChannel(component.items[1]);

    expect(router.navigate).toHaveBeenCalledWith(['/member/message-subscription/member', 2]);
  });
});
