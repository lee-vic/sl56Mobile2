import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { HomePage } from './home.page';

describe('HomePage (Swiper migration)', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [HomePage],
      providers: [
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── 1. Basic creation ─────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── 2. Swiper options ─────────────────────────────────────────────
  it('swiperOptions has autoplay.delay=3000, loop=true and clickable pagination', () => {
    const opts = component.swiperOptions;
    expect((opts.autoplay as any).delay).toBe(3000);
    expect(opts.loop).toBe(true);
    expect((opts.pagination as any).clickable).toBe(true);
  });

  // ── 3. openProduct navigation ─────────────────────────────────────
  it('openProduct() navigates to the product tab with product id', () => {
    component.openProduct({ image: '', product: 'cement' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/tabs/product', 'cement']);
  });

  // ── 4. openNews with cateId ───────────────────────────────────────
  it('openNews() navigates to the news tab when cateId is defined', () => {
    component.openNews({ title: '', description: '', image: '', cateId: 3 });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/tabs/news', 3]);
  });

  // ── 5. openNews guard – null cateId ──────────────────────────────
  it('openNews() does NOT navigate when cateId is null / undefined', () => {
    component.openNews({ title: '', description: '', image: '' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ── 6. Template – <swiper> element exists ────────────────────────
  it('renders a <swiper> element in the template', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('swiper')).not.toBeNull();
  });
});
