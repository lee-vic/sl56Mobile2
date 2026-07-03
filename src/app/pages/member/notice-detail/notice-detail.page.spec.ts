import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { of, Subject, throwError } from 'rxjs';
import { NoticeService } from 'src/app/providers/notice.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { NoticeDetailPage } from './notice-detail.page';

describe('NoticeDetailPage', () => {
  let component: NoticeDetailPage;
  let fixture: ComponentFixture<NoticeDetailPage>;
  let getDetailSpy: jasmine.Spy;
  let toastSpy: jasmine.Spy;

  beforeEach(async(() => {
    getDetailSpy = jasmine.createSpy('getDetail').and.returnValue(of(null));
    toastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([]), FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: NoticeService, useValue: { getDetail: getDetailSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: toastSpy } },
      ],
      declarations: [ NoticeDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoticeDetailPage);
    component = fixture.componentInstance;
    getDetailSpy.calls.reset();
    getDetailSpy.and.returnValue(of(null));
    toastSpy.calls.reset();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show skeleton while detail is loading', () => {
    const pending$ = new Subject<unknown>();
    getDetailSpy.and.returnValue(pending$.asObservable());

    fixture.detectChanges();

    expect(component.isLoading).toBe(true);
    expect(fixture.nativeElement.querySelector('.skeleton-card')).toBeTruthy();
  });

  it('should load notice detail', () => {
    getDetailSpy.and.returnValue(of({
      NoticeId: 7,
      Title: '业务公告',
      Summary: '<p>内容</p>',
      CreateAt: '2026-07-01',
      IsRead: true,
    }));

    fixture.detectChanges();

    expect(component.notice.Title).toBe('业务公告');
    expect(component.isLoaded).toBe(true);
    expect(component.loadError).toBe(false);
  });

  it('should enter error state when detail fails', () => {
    getDetailSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(component.notice).toBeNull();
    expect(toastSpy).toHaveBeenCalledWith('公告详情加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });
});
