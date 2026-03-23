import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { of } from 'rxjs';

import { Notice } from '../../../interfaces/notice';
import { NoticeService } from '../../../providers/notice.service';
import { NewsPage } from './news.page';

const NOTICE_1: Notice = { NoticeId: 1, Title: 'A', Summary: 'sa', CreateAt: '2024-01-01', IsRead: false };
const NOTICE_2: Notice = { NoticeId: 2, Title: 'B', Summary: 'sb', CreateAt: '2024-01-02', IsRead: false };

describe('NewsPage (infinite-scroll migration)', () => {
  let component: NewsPage;
  let fixture: ComponentFixture<NewsPage>;
  let mockService:  jasmine.SpyObj<NoticeService>;
  let mockNavCtrl:  jasmine.SpyObj<NavController>;

  function makeScrollMock() {
    return { disabled: false, target: { complete: jasmine.createSpy('scroll.complete') } };
  }

  beforeEach(async(() => {
    mockService  = jasmine.createSpyObj('NoticeService', ['getNewsList']);
    mockNavCtrl  = jasmine.createSpyObj('NavController', ['navigateForward']);
    mockService.getNewsList.and.returnValue(of([NOTICE_1, NOTICE_2]));

    TestBed.configureTestingModule({
      declarations: [NewsPage],
      providers: [
        { provide: NoticeService,    useValue: mockService },
        { provide: Router,           useValue: {} },
        { provide: NavController,    useValue: mockNavCtrl },
        { provide: ModalController,  useValue: { create: () => Promise.resolve({ present: () => {} }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '2' }) } }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture   = TestBed.createComponent(NewsPage);
    component = fixture.componentInstance;
    // detectChanges() triggers ngOnInit → getItems(noticeTabs[0], null)
    // This is safe: mock returns 2 items so the null-scroll branch is skipped
    fixture.detectChanges();
  });

  // ── 1. Creation ───────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── 2. ngOnInit loads first tab ───────────────────────────────────
  it('ngOnInit() calls getNewsList with the first tab categoryId and page 1', () => {
    // ngOnInit was already called by fixture.detectChanges() in beforeEach
    expect(mockService.getNewsList).toHaveBeenCalledWith('2', 1);
  });

  // ── 3. getItems success ───────────────────────────────────────────
  it('getItems() appends items, increments currentPageIndex, and calls scroll.complete()', () => {
    const tab    = component.noticeTabs[1]; // fresh tab (not pre-loaded)
    const scroll = makeScrollMock();

    component.getItems(tab, scroll);

    expect(tab.items.length).toBe(2);
    expect(tab.currentPageIndex).toBe(2);
    expect(scroll.target.complete).toHaveBeenCalled();
    expect(scroll.disabled).toBe(false);
  });

  // ── 4. getItems – empty response disables scroll ──────────────────
  it('getItems() disables infinite scroll when the server returns no more items', () => {
    mockService.getNewsList.and.returnValue(of([]));
    const tab    = component.noticeTabs[2];
    const scroll = makeScrollMock();

    component.getItems(tab, scroll);

    expect(scroll.disabled).toBe(true);
    expect(tab.items.length).toBe(0);
  });

  // ── 5. getItems – null scroll is safe ────────────────────────────
  it('getItems() with null infiniteScroll does not throw', () => {
    const tab = component.noticeTabs[3];
    expect(() => component.getItems(tab, null)).not.toThrow();
  });

  // ── 6. isBusy guard ───────────────────────────────────────────────
  it('getItems() returns immediately when isBusy is true', () => {
    const tab = component.noticeTabs[1];
    tab.isBusy = true;
    const countBefore = mockService.getNewsList.calls.count();
    component.getItems(tab, null);
    expect(mockService.getNewsList.calls.count()).toBe(countBefore);
  });

  // ── 7. openDetail navigation ─────────────────────────────────────
  it('openDetail() navigates to the notice detail route', () => {
    component.openDetail({ NoticeId: 99, Title: '', Summary: '', CreateAt: '', IsRead: false });
    expect(mockNavCtrl.navigateForward).toHaveBeenCalledWith('/member/notice-detail/99');
  });
});
