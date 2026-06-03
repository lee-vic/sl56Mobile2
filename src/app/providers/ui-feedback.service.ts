import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class UiFeedbackService {
  constructor(
    private readonly toastController: ToastController
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
}