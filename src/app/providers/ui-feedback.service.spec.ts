import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { UiFeedbackService } from './ui-feedback.service';

describe('UiFeedbackService', () => {
  let service: UiFeedbackService;

  const toastPresentSpy = jasmine.createSpy('toastPresent').and.returnValue(Promise.resolve());
  const toastCreateSpy = jasmine
    .createSpy('toastCreate')
    .and.returnValue(Promise.resolve({ present: toastPresentSpy } as any));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UiFeedbackService,
        { provide: ToastController, useValue: { create: toastCreateSpy } },
      ],
    });

    service = TestBed.inject(UiFeedbackService);
    toastCreateSpy.calls.reset();
    toastPresentSpy.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

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

  it('should work with all valid color values', async () => {
    const colors: Array<'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark'> = [
      'primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'light', 'medium', 'dark'
    ];

    for (const color of colors) {
      toastCreateSpy.calls.reset();
      await service.presentToast('test', 1000, 'bottom', undefined, color);
      expect(toastCreateSpy).toHaveBeenCalledWith({
        message: 'test',
        duration: 1000,
        position: 'bottom',
        cssClass: undefined,
        color,
      });
    }
  });
});
