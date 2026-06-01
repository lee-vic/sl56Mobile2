import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController, AlertController, ToastController, ModalController, LoadingController } from '@ionic/angular';
import { ReturnService } from 'src/app/providers/return.service';
import { ActivatedRoute } from '@angular/router';
import { ReturnApplyHistoryPage } from '../return-apply-history/return-apply-history.page';

@Component({
  selector: 'app-return-apply',
  templateUrl: './return-apply.page.html',
  styleUrls: ['./return-apply.page.scss'],
})
export class ReturnApplyPage implements OnInit {
  ids: string;
  data: any;
  type: number;
  isSubmitting = false;
  isInitialLoading = false;
  hasInitError = false;
  initErrorMessage = '';
  isApplyBlocked = false;
  blockedMessage = '';
  submitSuccess = false;
  submitSuccessMessage = '';

  private get normalizedIdList(): string[] {
    if (!this.ids) {
      return [];
    }
    return this.ids
      .split(',')
      .map(id => id.trim())
      .filter(id => !!id)
      .filter(id => /^\d+$/.test(id))
      .filter((id, index, arr) => arr.indexOf(id) === index);
  }

  get selectedCount(): number {
    return this.normalizedIdList.length;
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return '提交中...';
    }
    return this.type === 0 ? '提交退货申请' : '提交提货信息';
  }

  get canShowForm(): boolean {
    return !this.isInitialLoading && !this.hasInitError && !this.isApplyBlocked && !this.submitSuccess;
  }

  get pageTitleText(): string {
    return this.type === 0 ? '申请退货' : '补填提货信息';
  }

  ngOnInit(): void {
    this.loadInitData();
  }
  public applyForm: FormGroup;
  constructor(public navCtrl: NavController,
    public formBuilder: FormBuilder,
    public service: ReturnService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    public modalCtrl: ModalController,
    public loadingController: LoadingController,
    private route: ActivatedRoute
  ) {
    const queryParams = this.route.snapshot.queryParams || {};
    this.type = this.parseType(queryParams.type);
    this.ids = this.normalizeIds(queryParams.ids);
    this.applyForm = this.formBuilder.group({
      PersonName: ["", Validators.required],
      MobilePhone: [
        "",
        Validators.compose([Validators.required, Validators.pattern("^1[3|4|5|7|8][0-9]{9}$"),]),
      ],
      Remark: [""],
      RequiredDate: [],
      ReferenceNumber: [],
      IdList: this.ids,
    });
  }

  private parseType(rawType: any): number {
    const parsed = Number(rawType);
    return parsed === 1 ? 1 : 0;
  }

  private normalizeIds(rawIds: any): string {
    if (rawIds === null || rawIds === undefined) {
      return '';
    }

    const source = Array.isArray(rawIds) ? rawIds.join(',') : rawIds.toString();
    const normalized = source
      .split(',')
      .map(id => id.trim())
      .filter(id => !!id)
      .filter(id => /^\d+$/.test(id))
      .filter((id, index, arr) => arr.indexOf(id) === index);

    return normalized.join(',');
  }

  doSubmit(form: any) {
    if (this.isSubmitting) {
      return;
    }

    if (this.selectedCount === 0) {
      this.presentToast('未找到有效退货单号，请返回待退货列表重试', 1800);
      return;
    }

    if (this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      this.presentToast('请先完善必填信息后再提交');
      return;
    }

    if (this.type === 0) {
      form.IdList = this.ids;
      this.doApply(form);
    }
    else {
      form.IdList = this.ids;
      this.doFill(form);
    }

  }
  doApply(form: any) {
    this.isSubmitting = true;
    this.presentLoading('请稍后...').then(loader => {
      this.service.apply1(form).subscribe({
        next: (res) => {
          this.finishSubmitting(loader);
          if (res.IsSuccess === false) {
            this.presentAlert('提交未成功', res.ErrorMessage);
          }
          else {
            this.submitSuccess = true;
            this.submitSuccessMessage = '退货申请已提交，客服将尽快处理';
          }
        },
        error: (_error) => {
          this.finishSubmitting(loader);
          this.presentAlert('提交失败', '网络或服务暂不可用，请稍后重试。');
        }
      });
    });
  }

  doFill(form: any) {
    this.isSubmitting = true;
    this.presentLoading('请稍后...').then(loader => {
      this.service.fill1(form).subscribe({
        next: (res) => {
          this.finishSubmitting(loader);
          if (res.IsSuccess === false) {
            this.presentAlert('提交未成功', res.Message);
            return;
          }

          this.submitSuccess = true;
          this.submitSuccessMessage = '提货信息已提交';
        },
        error: () => {
          this.finishSubmitting(loader);
          this.presentAlert('提交失败', '网络或服务暂不可用，请稍后重试。');
        }
      });
    });
  }

  retryLoad(): void {
    this.loadInitData();
  }

  backToWaitingList(): void {
    this.navCtrl.navigateBack('/member/return-waiting');
  }

  backToDeliveryRecord(): void {
    this.navCtrl.navigateBack('/member/delivery-record/list');
  }

  private loadInitData(): void {
    this.isInitialLoading = true;
    this.hasInitError = false;
    this.initErrorMessage = '';
    this.isApplyBlocked = false;
    this.blockedMessage = '';
    this.submitSuccess = false;
    this.submitSuccessMessage = '';

    if (this.selectedCount === 0) {
      this.isInitialLoading = false;
      this.hasInitError = true;
      this.initErrorMessage = '缺少有效退货单号，请返回待退货列表重新选择。';
      return;
    }

    if (this.type === 0) {
      this.service.apply(this.ids).subscribe({
        next: (res) => {
          this.data = res;
          if (res.AllowApply === false) {
            this.isApplyBlocked = true;
            this.blockedMessage = res.ErrorMessage || '当前单号暂不可申请退货';
            this.isInitialLoading = false;
            return;
          }

          this.applyForm.controls['RequiredDate'].setValue(res.RequiredDate);
          this.applyForm.controls['ReferenceNumber'].setValue(res.ReferenceNumber);
          this.isInitialLoading = false;
        },
        error: () => {
          this.hasInitError = true;
          this.initErrorMessage = '退货信息加载失败，请检查网络后重试。';
          this.isInitialLoading = false;
        }
      });
      return;
    }

    this.service.fill(this.ids).subscribe({
      next: (res) => {
        this.applyForm.controls['RequiredDate'].setValue(res.RequiredDate);
        this.applyForm.controls['ReferenceNumber'].setValue(res.ReferenceNumber);
        this.isInitialLoading = false;
      },
      error: () => {
        this.hasInitError = true;
        this.initErrorMessage = '提货信息加载失败，请检查网络后重试。';
        this.isInitialLoading = false;
      }
    });
  }
  history() {
    this.presentModal();
  }
  async presentModal() {

    const modal = await this.modalCtrl.create({
      component: ReturnApplyHistoryPage
    });
    modal.onDidDismiss().then((ev) => {
      const val = ev?.data?.['val'];
      if (val !== undefined) {
        let vals = val.split(' ');
        this.applyForm.controls["PersonName"].setValue(vals[0]);
        this.applyForm.controls["MobilePhone"].setValue(vals[1]);
      
      }


    });
    return await modal.present();
  }

  private presentToast(message: string, duration: number = 1500): void {
    this.toastCtrl.create({
      message,
      duration,
      position: 'middle'
    }).then(p => p.present());
  }

  private presentAlert(header: string, message: string): void {
    this.alertCtrl.create({
      header,
      message,
      buttons: ['确定']
    }).then(alert => alert.present());
  }

  private async presentLoading(message: string) {
    const loader = await this.loadingController.create({ message });
    await loader.present();
    return loader;
  }

  private finishSubmitting(loader: { dismiss: () => Promise<boolean> }): void {
    this.isSubmitting = false;
    loader.dismiss();
  }
}
