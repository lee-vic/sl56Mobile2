import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class UiFeedbackService {
  constructor(
    private readonly toastController: ToastController,
    private readonly loadingController: LoadingController
  ) {}

  async presentToast(
    message: string,
    duration: number = 2000,
    position: 'top' | 'middle' | 'bottom' = 'middle',
    cssClass?: string,
    color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position,
      cssClass,
      color
    });
    await toast.present();
  }

  async presentLoading(message: string, duration?: number): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message,
      duration
    });
    await loading.present();
    return loading;
  }

  async dismissLoading(loading?: HTMLIonLoadingElement | null): Promise<void> {
    if (!loading) {
      return;
    }
    try {
      await loading.dismiss();
    } catch {
      // Ignore dismiss race if overlay is already closed.
    }
  }
}