import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { of, Subject, throwError } from 'rxjs';

import { ReturnApplyHistoryPage } from './return-apply-history.page';
import { ReturnService } from 'src/app/providers/return.service';

describe('ReturnApplyHistoryPage', () => {
  let component: ReturnApplyHistoryPage;
  let fixture: ComponentFixture<ReturnApplyHistoryPage>;

  const applyHistorySpy = jasmine.createSpy('applyHistory').and.returnValue(of([]));
  const dismissSpy = jasmine.createSpy('dismiss');

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        CookieService,
        { provide: ReturnService, useValue: { applyHistory: applyHistorySpy } },
        { provide: ModalController, useValue: { dismiss: dismissSpy } },
      ],
      declarations: [ ReturnApplyHistoryPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnApplyHistoryPage);
    component = fixture.componentInstance;
    applyHistorySpy.calls.reset();
    applyHistorySpy.and.returnValue(of([]));
    dismissSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show skeleton while history initializes', () => {
    const pending$ = new Subject<string[]>();
    applyHistorySpy.and.returnValue(pending$.asObservable());

    fixture.detectChanges();

    expect(component.showSkeleton).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.skeleton-item').length).toBeGreaterThan(0);
  });

  it('should load and filter contacts', () => {
    applyHistorySpy.and.returnValue(of(['张三 13800138000', '李四 13900139000']));

    fixture.detectChanges();
    component.onSearchInput({ detail: { value: '李四' } } as CustomEvent);

    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].personName).toBe('李四');
  });

  it('should clear search and restore contact list', () => {
    applyHistorySpy.and.returnValue(of(['张三 13800138000', '李四 13900139000']));

    fixture.detectChanges();
    component.onSearchInput({ detail: { value: '张三' } } as CustomEvent);
    expect(component.filteredItems.length).toBe(1);

    component.clearSearch();

    expect(component.searchKeyword).toBe('');
    expect(component.filteredItems.length).toBe(2);
  });

  it('should parse contacts with extra whitespace', () => {
    applyHistorySpy.and.returnValue(of(['  王五   13700137000  ']));

    fixture.detectChanges();

    expect(component.filteredItems[0].raw).toBe('王五   13700137000');
    expect(component.filteredItems[0].personName).toBe('王五');
    expect(component.filteredItems[0].mobilePhone).toBe('13700137000');
  });

  it('should dismiss selected contact with structured data', () => {
    applyHistorySpy.and.returnValue(of(['张三 13800138000']));
    fixture.detectChanges();

    component.chooseContact(component.filteredItems[0]);
    component.select();

    expect(dismissSpy).toHaveBeenCalledWith({
      val: '张三 13800138000',
      personName: '张三',
      mobilePhone: '13800138000'
    });
  });

  it('should not dismiss when no contact is selected', () => {
    applyHistorySpy.and.returnValue(of(['张三 13800138000']));
    fixture.detectChanges();

    component.select();

    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('should enter error state when history loading fails', () => {
    applyHistorySpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.hasLoadError).toBe(true);
    expect(component.isLoaded).toBe(true);
  });
});
