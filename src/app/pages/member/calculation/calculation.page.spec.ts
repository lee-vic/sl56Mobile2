import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';

import { CalculationPage } from './calculation.page';

describe('CalculationPage', () => {
  let component: CalculationPage;
  let fixture: ComponentFixture<CalculationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [CookieService],
      declarations: [ CalculationPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalculationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to 不限 when switching to full mode', () => {
    component.modeOfTransportList = [
      { Id: 0, Name: '不限' },
      { Id: 1, Name: 'DHL' },
    ];

    component.segmentChanged({ detail: { value: '2' } } as any);

    expect(component.myForm.get('ModeOfTransportIdList')?.value).toBe(0);
  });

  it('should keep selected transport when switching to full mode', () => {
    component.modeOfTransportList = [
      { Id: 0, Name: '不限' },
      { Id: 2, Name: 'FEDEX' },
    ];
    component.myForm.get('ModeOfTransportIdList')?.setValue(2);

    component.segmentChanged({ detail: { value: '2' } } as any);

    expect(component.myForm.get('ModeOfTransportIdList')?.value).toBe(2);
  });
});
