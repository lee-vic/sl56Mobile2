import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CountryService } from 'src/app/providers/country.service';
import { RemoteService } from 'src/app/providers/remote.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { RemotePage } from './remote.page';

describe('RemotePage', () => {
  let component: RemotePage;
  let fixture: ComponentFixture<RemotePage>;
  let remoteServiceSpy: jasmine.SpyObj<RemoteService>;
  let countryServiceSpy: jasmine.SpyObj<CountryService>;
  let uiFeedbackSpy: jasmine.SpyObj<UiFeedbackService>;

  beforeEach(async(() => {
    remoteServiceSpy = jasmine.createSpyObj('RemoteService', ['getModeOfTransportTypeList', 'Query']);
    countryServiceSpy = jasmine.createSpyObj('CountryService', ['getCoutryList']);
    uiFeedbackSpy = jasmine.createSpyObj('UiFeedbackService', ['presentToast']);
    uiFeedbackSpy.presentToast.and.returnValue(Promise.resolve());

    remoteServiceSpy.getModeOfTransportTypeList.and.returnValue(of([
      { Id: 1, Name: '空运' },
      { Id: 2, Name: '海运' },
    ]));
    countryServiceSpy.getCoutryList.and.returnValue(of([
      { Id: 100, Name: '中国', UsePostalcode: true },
      { Id: 200, Name: '美国', UsePostalcode: true },
    ]));

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        {
          provide: RemoteService,
          useValue: remoteServiceSpy,
        },
        {
          provide: CountryService,
          useValue: countryServiceSpy,
        },
        {
          provide: UiFeedbackService,
          useValue: uiFeedbackSpy,
        },
      ],
      declarations: [ RemotePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemotePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load mode and country options on init', () => {
    expect(component.modeOfTransportTypeList.length).toBe(2);
    expect(component.countryList.length).toBe(2);
    expect(component.myForm.get('ModeOfTransportTypeId')?.value).toBe(1);
  });

  it('should stop query when selected country is invalid', () => {
    remoteServiceSpy.Query.and.returnValue(of({ Status: 0, IsRemote: false, Message: '' }));
    component.myForm.patchValue({
      ModeOfTransportTypeId: 1,
      countryId: '不存在国家',
      postalCode: '',
      city: '',
    });

    component.doQuery(component.myForm.value);

    expect(remoteServiceSpy.Query).not.toHaveBeenCalled();
    expect(component.isCountryInvalid).toBe(true);
    expect(uiFeedbackSpy.presentToast).toHaveBeenCalled();
  });

  it('should map remote result after query', () => {
    remoteServiceSpy.Query.and.returnValue(of({ Status: 0, IsRemote: true, Message: '' }));
    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    component.myForm.patchValue({
      ModeOfTransportTypeId: 1,
      postalCode: '10001',
      city: 'New York',
    });

    component.doQuery(component.myForm.value);

    expect(remoteServiceSpy.Query).toHaveBeenCalled();
    expect(component.queryResult?.title).toBe('偏远');
    expect(component.queryResult?.success).toBe(true);
    expect(component.queryResult?.isRemote).toBe(true);
  });

  it('should set query error state when request fails', () => {
    remoteServiceSpy.Query.and.returnValue(throwError(() => new Error('network')));
    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    component.myForm.patchValue({
      ModeOfTransportTypeId: 1,
      postalCode: '10001',
      city: 'New York',
    });

    component.doQuery(component.myForm.value);

    expect(component.queryErrorMessage).toBe('网络异常，暂时无法完成查询，请稍后重试。');
    expect(component.queryResult).toBeNull();
    expect(component.isQuerying).toBe(false);
  });

  it('should stop query subscription on destroy', () => {
    const querySubject = new Subject<any>();
    remoteServiceSpy.Query.and.returnValue(querySubject.asObservable());
    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    component.myForm.patchValue({
      ModeOfTransportTypeId: 1,
      postalCode: '10001',
      city: 'New York',
    });

    component.doQuery(component.myForm.value);
    expect(component.isQuerying).toBe(true);

    component.ngOnDestroy();
    querySubject.next({ Status: 0, IsRemote: true, Message: '' });

    expect(component.queryResult).toBeNull();
    expect(component.isQuerying).toBe(false);
  });
});
