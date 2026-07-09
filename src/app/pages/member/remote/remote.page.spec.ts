import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
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
    remoteServiceSpy = jasmine.createSpyObj('RemoteService', ['Query', 'GetESD', 'CountryHasPostcode']);
    countryServiceSpy = jasmine.createSpyObj('CountryService', ['getCoutryList']);
    uiFeedbackSpy = jasmine.createSpyObj('UiFeedbackService', ['presentToast', 'presentLoading', 'dismissLoading']);
    uiFeedbackSpy.presentToast.and.returnValue(Promise.resolve());
    uiFeedbackSpy.presentLoading.and.returnValue(Promise.resolve({ dismiss: jasmine.createSpy('dismiss') } as any));
    uiFeedbackSpy.dismissLoading.and.returnValue(Promise.resolve());
    remoteServiceSpy.CountryHasPostcode.and.returnValue(of({ success: true, hasPostcode: true }));
    remoteServiceSpy.GetESD.and.returnValue(of({ success: true, data: [] }));

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

  it('should load country options on init', () => {
    expect(component.countryList.length).toBe(2);
  });

  it('should stop query when selected country is invalid', () => {
    remoteServiceSpy.Query.and.returnValue(of({ Status: 0, IsRemote: false, Message: '' }));
    component.myForm.patchValue({
      countryId: '不存在国家',
      postalCode: '',
      city: '',
    });

    component.doQuery(component.myForm.value);

    expect(remoteServiceSpy.Query).not.toHaveBeenCalled();
    expect(component.isCountryInvalid).toBe(true);
    expect(uiFeedbackSpy.presentToast).toHaveBeenCalled();
  });

  it('should map remote result after query', fakeAsync(() => {
    remoteServiceSpy.Query.and.returnValue(of({
      Status: 0,
      IsRemote: true,
      Message: '',
      Results: [
        { ModeOfTransportTypeId: 1, ModeOfTransportTypeName: 'DHL', Status: 0, IsRemote: true, Message: '' },
        { ModeOfTransportTypeId: 2, ModeOfTransportTypeName: 'UPS', Status: 0, IsRemote: false, Message: '' },
      ],
    }));
    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    component.myForm.patchValue({
      postalCode: '10001',
      city: 'New York',
    });

    component.doQuery(component.myForm.value);
    tick();

    expect(remoteServiceSpy.Query).toHaveBeenCalled();
    expect(component.queryResult?.title).toBe('存在偏远运输方式');
    expect(component.queryResult?.success).toBe(true);
    expect(component.queryResult?.isRemote).toBe(true);
    expect(component.queryResult?.items.length).toBe(2);
    expect(component.queryResult?.items[0].statusText).toBe('偏远');
    discardPeriodicTasks();
  }));

  it('should refresh postcode availability when country is selected', fakeAsync(() => {
    remoteServiceSpy.CountryHasPostcode.and.returnValue(of({ success: true, hasPostcode: false }));

    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    tick();

    expect(remoteServiceSpy.CountryHasPostcode).toHaveBeenCalledWith(200);
    expect(component.postcodeEnabled).toBe(false);
    expect(component.shouldShowPostalCode).toBe(false);
    discardPeriodicTasks();
  }));

  it('should clear location inputs and ESD options when country changes', fakeAsync(() => {
    component.esdOptions = [
      { ObjectId: 1, City: 'REDMOND', PostcodeLow: '98052', PostcodeHigh: '98052', DisplayText: 'REDMOND / 98052' },
    ];
    component.esdLookupMode = 'postalCode';
    component.myForm.patchValue({
      postalCode: '98052',
      city: 'REDMOND',
    }, { emitEvent: false });

    component.countryItemClick({ Id: 100, Name: '中国', UsePostalcode: true });
    tick();

    expect(component.myForm.get('postalCode')?.value).toBe('');
    expect(component.myForm.get('city')?.value).toBe('');
    expect(component.esdOptions.length).toBe(0);
    expect(component.esdLookupMode).toBe('');
    discardPeriodicTasks();
  }));

  it('should ignore stale postal code when selected country has no postcode data', fakeAsync(() => {
    remoteServiceSpy.CountryHasPostcode.and.returnValue(of({ success: true, hasPostcode: false }));
    remoteServiceSpy.Query.and.returnValue(of({
      Status: 0,
      IsRemote: false,
      Message: '',
      Results: [
        { ModeOfTransportTypeId: 1, ModeOfTransportTypeName: 'DHL', Status: 0, IsRemote: false, Message: '' },
      ],
    }));

    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    tick();
    component.myForm.patchValue({
      postalCode: '98052',
      city: 'REDMOND',
    }, { emitEvent: false });

    component.doQuery(component.myForm.value);
    tick();

    expect(remoteServiceSpy.Query).toHaveBeenCalledWith(jasmine.objectContaining({
      postalCode: '',
      city: 'REDMOND',
    }));
    discardPeriodicTasks();
  }));

  it('should fill city when postcode has a unique ESD city', fakeAsync(() => {
    remoteServiceSpy.GetESD.and.returnValue(of({
      success: true,
      data: [
        { ObjectId: 1, City: 'REDMOND', PostcodeLow: '98052', PostcodeHigh: '98052', DisplayText: 'REDMOND / 98052' },
      ],
    }));
    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    tick();

    component.myForm.get('postalCode')?.setValue('980');
    tick(300);

    expect(remoteServiceSpy.GetESD).toHaveBeenCalled();
    expect(component.myForm.get('city')?.value).toBe('REDMOND');
    discardPeriodicTasks();
  }));

  it('should set query error state when request fails', fakeAsync(() => {
    remoteServiceSpy.Query.and.returnValue(throwError(() => new Error('network')));
    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    component.myForm.patchValue({
      postalCode: '10001',
      city: 'New York',
    });

    component.doQuery(component.myForm.value);
    tick();

    expect(component.queryErrorMessage).toBe('网络异常，暂时无法完成查询，请稍后重试。');
    expect(component.queryResult).toBeNull();
    expect(component.isQuerying).toBe(false);
    discardPeriodicTasks();
  }));

  it('should stop query subscription on destroy', fakeAsync(() => {
    const querySubject = new Subject<any>();
    remoteServiceSpy.Query.and.returnValue(querySubject.asObservable());
    component.countryItemClick({ Id: 200, Name: '美国', UsePostalcode: true });
    component.myForm.patchValue({
      postalCode: '10001',
      city: 'New York',
    });

    component.doQuery(component.myForm.value);
    tick();
    expect(component.isQuerying).toBe(true);

    component.ngOnDestroy();
    querySubject.next({ Status: 0, IsRemote: true, Message: '' });

    expect(component.queryResult).toBeNull();
    expect(component.isQuerying).toBe(false);
    discardPeriodicTasks();
  }));
});
