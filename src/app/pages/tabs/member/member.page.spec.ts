import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';

import { MemberPage } from './member.page';

describe('MemberPage', () => {
  let component: MemberPage;
  let fixture: ComponentFixture<MemberPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [CookieService],
      declarations: [ MemberPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply custom quick menu order', () => {
    const visibleMenus = [
      component.allMenus[0],
      component.allMenus[1],
      component.allMenus[2],
      component.allMenus[3],
    ];

    (component as any).applyQuickMenuCustomization(visibleMenus, ['偏远查询', '价格查询', '业务公告']);

    expect(component.quickMenuList.map(m => m.title)).toEqual(['偏远查询', '价格查询', '业务公告']);
    expect(component.otherMenuList.map(m => m.title)).toEqual(['交货清单确认']);
  });

  it('should prevent selecting more than quick menu limit', () => {
    component.draftQuickMenuTitles = ['A', 'B', 'C', 'D', 'E', 'F'];
    spyOn(component, 'showToast');

    component.onDraftSelectionChange('G', true);

    expect(component.draftQuickMenuTitles).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(component.showToast).toHaveBeenCalledWith('常用功能最多选择6项');
  });

  it('should reset quick menus to defaults', () => {
    const visibleMenus = component.allMenus.filter(menu => menu.type.indexOf(0) > -1);
    component.username = 'test-user';
    component.visibleMenuOptions = visibleMenus;
    (component as any).applyQuickMenuCustomization(visibleMenus, ['退货管理', '微信支付']);

    component.resetQuickMenus();

    expect(component.quickMenuList.map(m => m.title)).toEqual([
      '价格查询',
      '交货清单确认',
      '问题跟进',
      '交货记录',
      '偏远查询',
      '微信支付',
    ]);
  });

  it('should prevent selecting less than quick menu minimum', () => {
    component.visibleMenuOptions = component.allMenus.slice(0, 6);
    component.draftQuickMenuTitles = ['价格查询', '偏远查询', '业务公告'];
    spyOn(component, 'showToast');

    component.onDraftSelectionChange('价格查询', false);

    expect(component.draftQuickMenuTitles).toEqual(['价格查询', '偏远查询', '业务公告']);
    expect(component.showToast).toHaveBeenCalledWith('常用功能至少选择3项');
  });
});
