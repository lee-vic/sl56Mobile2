import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CompanyNameService } from 'src/app/providers/company-name.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
import { CompanyNamePage } from './company-name.page';

describe('CompanyNamePage', () => {
  let component: CompanyNamePage;
  let fixture: ComponentFixture<CompanyNamePage>;
  let serviceSpy: jasmine.SpyObj<CompanyNameService>;

  beforeEach(async(() => {
    serviceSpy = jasmine.createSpyObj('CompanyNameService', [
      'getList',
      'getDetail',
      'queryGlobal',
      'create',
      'edit',
      'getImageUrl',
    ]);
    serviceSpy.getList.and.returnValue(of([]));
    serviceSpy.queryGlobal.and.returnValue(of({
      Success: true,
      Message: '查询完成',
      CompanyName: 'ABC CO LTD',
      IsBlacklist: false,
      IsFiling: true,
    }));
    serviceSpy.getImageUrl.and.returnValue('/CompanyName/Image?id=1');

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      declarations: [CompanyNamePage],
      providers: [
        { provide: CompanyNameService, useValue: serviceSpy },
        { provide: UiFeedbackService, useValue: { presentToast: jasmine.createSpy('presentToast').and.returnValue(Promise.resolve()) } },
        { provide: Router, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl'), navigate: jasmine.createSpy('navigate'), events: of({}) } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyNamePage);
    component = fixture.componentInstance;
  });

  it('should create and load list', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(serviceSpy.getList).toHaveBeenCalled();
  });

  it('should query global company filing status', () => {
    fixture.detectChanges();
    component.queryForm.setValue({ CompanyName: 'abc co ltd' });

    component.doQuery();

    expect(serviceSpy.queryGlobal).toHaveBeenCalledWith({ CompanyName: 'ABC CO LTD' });
    expect(component.queryResult?.IsFiling).toBe(true);
  });
});
