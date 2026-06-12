import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';

import { LoginPage } from './login.page';
import { UserService } from 'src/app/providers/user.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let router: Router;

  const toastCreateSpy = jasmine.createSpy('toastCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));

  const loadingCreateSpy = jasmine.createSpy('loadingCreate').and.returnValue(Promise.resolve({ present: () => Promise.resolve(), dismiss: () => Promise.resolve() }));

  const authSpy = jasmine.createSpy('auth').and.returnValue(of({ Success: true }));
  const cookieGetSpy = jasmine.createSpy('get').and.callFake((key: string) => {
    if (key === 'OpenId') return 'open-id-1';
    if (key === 'UnionId') return 'union-id-1';
    if (key === 'State') return '/app/tabs/home';
    return '';
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: CookieService, useValue: { get: cookieGetSpy } },
        { provide: UserService, useValue: { auth: authSpy } },
        { provide: ToastController, useValue: { create: toastCreateSpy } },
        { provide: LoadingController, useValue: { create: loadingCreateSpy } }
      ],
      declarations: [ LoginPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    authSpy.calls.reset();
    toastCreateSpy.calls.reset();
    cookieGetSpy.calls.reset();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require username and password in login form', () => {
    component.authForm.patchValue({ username: '', password: '' });
    expect(component.authForm.valid).toBe(false);

    component.authForm.patchValue({ username: 'u1', password: 'p1' });
    expect(component.authForm.valid).toBe(true);
  });

  it('should navigate to state route when login succeeds', fakeAsync(() => {
    authSpy.and.returnValue(of({ Success: true }));
    const formValue = { ...component.authForm.value, username: 'u1', password: 'p1' };

    component.doLogin(formValue);
    tick();

    expect(authSpy).toHaveBeenCalled();
    const payload = authSpy.calls.mostRecent().args[0];
    expect(payload.clientType).toBe(1);
    expect(payload.openId).toBe('open-id-1');
    expect(payload.unionId).toBe('union-id-1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/tabs/home');
  }));

  it('should show toast when login response is unsuccessful', fakeAsync(() => {
    authSpy.and.returnValue(of({ Success: false, ErrMsg: '账号或密码错误' }));
    const formValue = { ...component.authForm.value, username: 'u1', password: 'wrong' };

    component.doLogin(formValue);
    tick();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(toastCreateSpy).toHaveBeenCalled();
  }));

  it('should show error toast when auth request fails', fakeAsync(() => {
    authSpy.and.returnValue(throwError(() => ({ message: 'network error' })));
    const formValue = { ...component.authForm.value, username: 'u1', password: 'p1' };

    component.doLogin(formValue);
    tick();

    expect(toastCreateSpy).toHaveBeenCalled();
    expect(loadingCreateSpy).toHaveBeenCalled();
  }));

  it('should present loading while login request runs', fakeAsync(() => {
    authSpy.and.returnValue(of({ Success: true }));

    component.doLogin({ username: 'u1', password: 'p1' });
    tick();

    expect(loadingCreateSpy).toHaveBeenCalled();
  }));

  it('should present loading when login response is unsuccessful', fakeAsync(() => {
    authSpy.and.returnValue(of({ Success: false, ErrMsg: '错误' }));

    component.doLogin({ username: 'u1', password: 'wrong' });
    tick();

    expect(loadingCreateSpy).toHaveBeenCalled();
  }));
});
