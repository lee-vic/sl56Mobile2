import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { BankPage } from './bank.page';

describe('BankPage', () => {
  let component: BankPage;
  let fixture: ComponentFixture<BankPage>;
  let presentToastSpy: jasmine.Spy;

  beforeEach(async(() => {
    presentToastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: UiFeedbackService, useValue: { presentToast: presentToastSpy } }
      ],
      declarations: [BankPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BankPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose configured bank accounts', () => {
    expect(component.accounts.length).toBe(2);
    expect(component.accounts[0].bankName).toBe('中国银行');
    expect(component.accounts[1].accountNo).toBe('755919924510101');
  });

  it('should copy account number and show success toast', async () => {
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });

    await component.copyAccountNo(component.accounts[0]);

    expect(writeText).toHaveBeenCalledWith('764057955149');
    expect(presentToastSpy).toHaveBeenCalledWith('银行账号已复制', 1600, 'middle', undefined, 'success');
  });
});
