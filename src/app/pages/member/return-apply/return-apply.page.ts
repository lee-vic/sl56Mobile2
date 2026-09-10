import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController, AlertController, ToastController, ModalController, LoadingController } from '@ionic/angular';
import { ReturnService } from 'src/app/providers/return.service';
import { ActivatedRoute } from '@angular/router';
import { ReturnApplyHistoryPage } from '../return-apply-history/return-apply-history.page';
import { ReturnApplyModel } from 'src/app/interfaces/return';
import { MAINLAND_CHINA_MOBILE_PATTERN } from 'src/app/validators/mobile-phone';
import { Observable, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

const RETURN_APPLY_NOTICE_MESSAGE = '退货流程：备货→审核→安排提货。退货提货前需先完成备货及审核流程，备货通常需约<strong>半小时</strong>；每日 <strong>11:30 至 13:30</strong> 暂不进行退货审核，其他非工作时间提交的申请也将顺延至后续工作时间处理。请在收到取件码后再安排提货，感谢您的理解与配合。';

@Component({
  selector: 'app-return-apply',
  templateUrl: './return-apply.page.html',
  styleUrls: ['./return-apply.page.scss'],
})
export class ReturnApplyPage implements OnInit, OnDestroy {
  ids: string;
  data: ReturnApplyModel;
  type: number;
  isInitialLoading = false;
  isSubmitting = false;
  hasInitError = false;
  initErrorMessage = '';
  isApplyBlocked = false;
  blockedMessage = '';
  warningMessage = '';
  submitSuccess = false;
  submitSuccessMessage = '';
  noticeMessage = RETURN_APPLY_NOTICE_MESSAGE;
  public applyForm: FormGroup;

  private readonly destroy$ = new Subject<void>();

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
        Validators.compose([Validators.required, Validators.pattern(MAINLAND_CHINA_MOBILE_PATTERN)]),
      ],
      Remark: [""],
      RequiredDate: [],
      ReferenceNumber: [],
      IdList: this.ids,
    });
  }

  ngOnInit(): void {
    this.loadInitData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private parseType(rawType: unknown): number {
    const parsed = Number(rawType);
    return parsed === 1 ? 1 : 0;
  }

  private normalizeIds(rawIds: unknown): string {
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

  doSubmit(form: ReturnApplyModel): void {
    if (this.selectedCount === 0) {
      this.presentToast('未找到有效退货单号，请返回待退货列表重试', 1800);
      return;
    }

    if (this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      this.presentToast('请先完善必填信息后再提交');
      return;
    }

    const payload: ReturnApplyModel = {
      ...form,
      IdList: this.ids
    };

    if (this.type === 0) {
      this.doApply(payload);
    }
    else {
      this.doFill(payload);
    }

  }

  doApply(form: ReturnApplyModel): void {
    this.submitWithLoading(
      () => this.service.apply1(form),
      '退货申请已提交',
      res => res.IsSuccess === false ? (res.ErrorMessage || '提交失败') : ''
    );
  }

  doFill(form: ReturnApplyModel): void {
    this.submitWithLoading(
      () => this.service.fill1(form),
      '提货信息已提交',
      res => res.IsSuccess === false ? (res.Message || '提交失败') : ''
    );
  }

  private submitWithLoading(
    requestFactory: () => Observable<ReturnApplyModel>,
    successMessage: string,
    getFailureMessage: (res: ReturnApplyModel) => string
  ): void {
    // 在创建异步加载框前加锁，避免快速连点；成功后也不能再次发起同一申请。
    if (this.isSubmitting || this.submitSuccess) {
      return;
    }
    this.isSubmitting = true;
    this.loadingController.create({ message: '请稍候...' }).then(loader => {
      loader.present();
      requestFactory()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isSubmitting = false;
            loader.dismiss();
          })
        )
        .subscribe({
          next: (res) => {
            const failureMessage = getFailureMessage(res);
            if (failureMessage) {
              this.presentAlert('提交未成功', failureMessage);
              return;
            }

            this.submitSuccess = true;
            this.submitSuccessMessage = successMessage;
          },
          error: () => {
            this.presentAlert('提交失败', '网络或服务暂不可用，请稍后重试。');
          }
        });
    }, () => {
      this.isSubmitting = false;
      this.presentAlert('提交失败', '加载提示未能打开，请稍后重试。');
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
    this.resetInitState();

    if (this.selectedCount === 0) {
      this.enterInitError('缺少有效退货单号，请返回待退货列表重新选择。');
      return;
    }

    if (this.type === 0) {
      this.service.apply(this.ids)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.data = res;
            if (res.AllowApply === false) {
              this.enterBlockedState(res.ErrorMessage || '当前单号暂不可申请退货');
              return;
            }

            this.applyInitResponse(res);
          },
          error: () => {
            this.enterInitError('退货信息加载失败，请检查网络后重试。');
          }
        });
      return;
    }

    this.service.fill(this.ids)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.applyInitResponse(res);
        },
        error: () => {
          this.enterInitError('提货信息加载失败，请检查网络后重试。');
        }
      });
  }

  private resetInitState(): void {
    this.isInitialLoading = true;
    this.hasInitError = false;
    this.initErrorMessage = '';
    this.isApplyBlocked = false;
    this.blockedMessage = '';
    this.warningMessage = '';
    this.noticeMessage = RETURN_APPLY_NOTICE_MESSAGE;
    this.submitSuccess = false;
    this.submitSuccessMessage = '';
  }

  private applyInitResponse(res: ReturnApplyModel): void {
    this.warningMessage = res.WarningMessage || '';
    this.noticeMessage = res.NoticeMessage || RETURN_APPLY_NOTICE_MESSAGE;
    this.applyForm.controls['RequiredDate'].setValue(res.RequiredDate);
    this.applyForm.controls['ReferenceNumber'].setValue(res.ReferenceNumber);
    this.isInitialLoading = false;
  }

  private enterInitError(message: string): void {
    this.isInitialLoading = false;
    this.hasInitError = true;
    this.initErrorMessage = message;
  }

  private enterBlockedState(message: string): void {
    this.isApplyBlocked = true;
    this.blockedMessage = message;
    this.isInitialLoading = false;
  }

  history(): void {
    this.presentModal();
  }

  async presentModal(): Promise<void> {

    const modal = await this.modalCtrl.create({
      component: ReturnApplyHistoryPage
    });
    modal.onDidDismiss<{ val?: string; personName?: string; mobilePhone?: string }>().then((ev) => {
      this.applyHistoryContact(ev?.data);
    });
    return await modal.present();
  }

  private applyHistoryContact(data?: { val?: string; personName?: string; mobilePhone?: string }): void {
    if (!data) {
      return;
    }

    if (data.personName || data.mobilePhone) {
      this.applyForm.controls['PersonName'].setValue(data.personName || '');
      this.applyForm.controls['MobilePhone'].setValue(data.mobilePhone || '');
      return;
    }

    if (data.val) {
      const vals = data.val.split(' ');
      this.applyForm.controls['PersonName'].setValue(vals[0]);
      this.applyForm.controls['MobilePhone'].setValue(vals[1]);
    }
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

}
