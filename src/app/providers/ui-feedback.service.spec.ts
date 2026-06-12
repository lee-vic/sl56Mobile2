import { TestBed } from '@angular/core/testing';
import { LoadingController, ToastController } from '@ionic/angular';
import { UiFeedbackService } from './ui-feedback.service';

describe('UiFeedbackService', () => {
  let service: UiFeedbackService;

  const toastPresentSpy = jasmine.createSpy('toastPresent').and.returnValue(Promise.resolve());
  const toastCreateSpy = jasmine
    .createSpy('toastCreate')
    .and.returnValue(Promise.resolve({ present: toastPresentSpy } as any));

  const loadingPresentSpy = jasmine.createSpy('loadingPresent').and.returnValue(Promise.resolve());
  const loadingDismissSpy = jasmine.createSpy('loadingDismiss').and.returnValue(Promise.resolve());
  const loadingCreateSpy = jasmine
    .createSpy('loadingCreate')
    .and.returnValue(Promise.resolve({ present: loadingPresentSpy, dismiss: loadingDismissSpy } as any));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UiFeedbackService,
        { provide: ToastController, useValue: { create: toastCreateSpy } },
        { provide: LoadingController, useValue: { create: loadingCreateSpy } },
      ],
    });

    service = TestBed.inject(UiFeedbackService);
    toastCreateSpy.calls.reset();
    toastPresentSpy.calls.reset();
    loadingCreateSpy.calls.reset();
    loadingPresentSpy.calls.reset();
    loadingDismissSpy.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── presentToast ──

  it('should call toastController.create with default values', async () => {
    await service.presentToast('Hello');

    expect(toastCreateSpy).toHaveBeenCalledWith({
      message: 'Hello',
      duration: 2000,
      position: 'middle',
      cssClass: undefined,
      color: undefined,
    });
    expect(toastPresentSpy).toHaveBeenCalled();
  });

  it('should pass custom duration and position', async () => {
    await service.presentToast('Error', 5000, 'top');

    expect(toastCreateSpy).toHaveBeenCalledWith({
      message: 'Error',
      duration: 5000,
      position: 'top',
      cssClass: undefined,
      color: undefined,
    });
    expect(toastPresentSpy).toHaveBeenCalled();
  });

  it('should pass custom cssClass and color', async () => {
    await service.presentToast('Success', 2000, 'middle', 'member-theme-toast', 'success');

    expect(toastCreateSpy).toHaveBeenCalledWith({
      message: 'Success',
      duration: 2000,
      position: 'middle',
      cssClass: 'member-theme-toast',
      color: 'success',
    });
    expect(toastPresentSpy).toHaveBeenCalled();
  });

  // ── presentLoading ──

  it('should call loadingController.create with message', async () => {
    const loading = await service.presentLoading('请稍候...');

    expect(loadingCreateSpy).toHaveBeenCalledWith({
      message: '请稍候...',
      duration: undefined,
    });
    expect(loadingPresentSpy).toHaveBeenCalled();
  });

  it('should pass duration to loadingController.create', async () => {
    await service.presentLoading('请稍候...', 5000);

    expect(loadingCreateSpy).toHaveBeenCalledWith({
      message: '请稍候...',
      duration: 5000,
    });
  });

  // ── dismissLoading ──

  it('should call dismiss on loading element', async () => {
    const loading = await service.presentLoading('请稍候...');
    await service.dismissLoading(loading);

    expect(loadingDismissSpy).toHaveBeenCalled();
  });

  it('should not throw when dismissing null loading', async () => {
    await expectAsync(service.dismissLoading(null)).toBeResolved();
  });

  it('should not throw when dismissing undefined loading', async () => {
    await expectAsync(service.dismissLoading(undefined)).toBeResolved();
  });

  it('should not throw when dismiss fails (race condition)', async () => {
    const failingDismiss = jasmine.createSpy('failingDismiss').and.returnValue(Promise.reject('already dismissed'));
    const fakeLoading = { dismiss: failingDismiss } as any;

    await expectAsync(service.dismissLoading(fakeLoading)).toBeResolved();
  });
});
