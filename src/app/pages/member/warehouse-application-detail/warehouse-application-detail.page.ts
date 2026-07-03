import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { WarehouseApplication } from 'src/app/interfaces/warehouse-application';
import { WarehouseApplicationService } from './../../../providers/warehouse-application.service';

interface WarehouseStatusMeta {
  label: string;
  color: string;
}

@Component({
  selector: 'app-warehouse-application-detail',
  templateUrl: './warehouse-application-detail.page.html',
  styleUrls: ['./warehouse-application-detail.page.scss']
})
export class WarehouseApplicationDetailPage implements OnInit {
  form: FormGroup;
  status = 0; //0初始，1已收款，2已入仓，9已取消
  id = 0;
  isLoading = false;
  isLoaded = false;
  loadError = false;
  isSaving = false;
  isCancelling = false;
  readonly sourceList = [
    { value: '国际快递', text: '国际快递' },
    { value: '国内快递', text: '国内快递' },
    { value: '自行送货', text: '自行送货' },
    { value: '司机提取', text: '司机提取' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private service: WarehouseApplicationService,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController
  ) {
    this.form = this.fb.group({
      ReferenceNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{8,32}$')]],
      Piece: [null, [Validators.required, Validators.min(1)]],
      Source: ['', Validators.required],
      Amount: [{ value: null, disabled: true }]
    });
  }

  ngOnInit(): void {
    this.id = +this.route.snapshot.paramMap.get('id');
    this.bindFormChanges();
    if (this.id > 0) {
      this.loadDetail();
    } else {
      this.isLoaded = true;
      this.updateEditableControlState();
    }
  }

  get isEditable(): boolean {
    return this.status === 0;
  }

  get showCancelButton(): boolean {
    return this.id > 0 && this.status !== 9;
  }

  getStatusMeta(status: number): WarehouseStatusMeta {
    if (status === 0) {
      return { label: '待支付', color: 'primary' };
    }
    if (status === 1) {
      return { label: '已收款', color: 'success' };
    }
    if (status === 2) {
      return { label: '已入仓', color: 'success' };
    }
    return { label: '已取消', color: 'medium' };
  }

  loadDetail(): void {
    this.isLoading = true;
    this.loadError = false;

    this.service.detail(this.id).pipe(
      finalize(() => {
        this.isLoading = false;
        this.isLoaded = true;
      })
    ).subscribe({
      next: res => {
        if (res.Success) {
          this.fillForm(res.Data);
        } else {
          this.loadError = true;
          this.presentAlert('操作失败', res.ErrMsg || '入仓申请详情加载失败');
        }
      },
      error: () => {
        this.loadError = true;
        this.presentAlert('操作失败', '入仓申请详情加载失败，请稍后重试');
      }
    });
  }

  fillForm(data: WarehouseApplication): void {
    if (!data) {
      this.loadError = true;
      return;
    }
    this.form.patchValue({
      ReferenceNumber: data.ReferenceNumber,
      Piece: data.Piece,
      Source: data.Source,
      Amount: data.Amount
    });
    this.status = data.Status;
    this.updateEditableControlState();
  }

  calculateAmount(piece: number): void {
    const amountControl = this.form.get('Amount');
    if (!amountControl) {
      return;
    }

    const parsedPiece = Number(piece);
    if (!Number.isFinite(parsedPiece) || parsedPiece < 1) {
      amountControl.setValue(null);
      return;
    }

    amountControl.setValue(parsedPiece <= 10 ? 143 : 285);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.presentAlert('信息填写不完善或者不符合要求', '请先检查完善后再保存');
      return;
    }

    this.isSaving = true;
    this.loadingCtrl.create({ message: '请稍候...' }).then(loading => {
      loading.present();
      const submitObj: WarehouseApplication = {
        Id: this.id || 0,
        ...this.form.getRawValue(),
        Amount: this.form.get('Amount').value,
        Status: this.status
      };
      this.service.save(submitObj).pipe(
        finalize(() => {
          this.isSaving = false;
          loading.dismiss();
        })
      ).subscribe({
        next: res => {
          if (!res.Success) {
            this.presentAlert('操作失败', res.ErrMsg || '保存失败，请稍后重试');
          } else {
            this.navCtrl.back();
          }
        },
        error: () => {
          this.presentAlert('操作失败', '保存失败，请稍后重试');
        }
      });
    });
  }

  cancel(): void {
    this.alertCtrl.create({
      header: '取消入仓申请',
      message: '取消后该申请将不能继续支付或入仓，是否确认取消？',
      buttons: [{
        text: '继续保留',
        role: 'cancel'
      }, {
        text: '确认取消',
        role: 'destructive',
        handler: () => this.cancelApplication()
      }],
      cssClass: 'alert-confirm'
    }).then(alert => alert.present());
  }

  private bindFormChanges(): void {
    const referenceNoControl = this.form.get('ReferenceNumber');
    if (referenceNoControl) {
      referenceNoControl.valueChanges.subscribe(value => {
        const currentValue = typeof value === 'string' ? value : '';
        const upperValue = currentValue.toUpperCase();
        if (upperValue !== currentValue) {
          referenceNoControl.setValue(upperValue, { emitEvent: false });
        }
      });
    }
    const pieceControl = this.form.get('Piece');
    if (pieceControl) {
      pieceControl.valueChanges.subscribe(value => {
        this.calculateAmount(value);
      });
    }
  }

  private cancelApplication(): void {
    this.isCancelling = true;
    this.loadingCtrl.create({ message: '正在取消...' }).then(loading => {
      loading.present();
      this.service.cancel(this.id).pipe(
        finalize(() => {
          this.isCancelling = false;
          loading.dismiss();
        })
      ).subscribe({
        next: res => {
          if (res.Success) {
            this.navCtrl.back();
          } else {
            this.presentAlert('操作失败', res.ErrMsg || '取消失败，请稍后重试');
          }
        },
        error: err => {
          this.presentAlert('操作失败', err?.message || '取消失败，请稍后重试');
        }
      });
    });
  }

  private updateEditableControlState(): void {
    const sourceControl = this.form.get('Source');
    if (!sourceControl) {
      return;
    }
    if (this.isEditable) {
      sourceControl.enable({ emitEvent: false });
    } else {
      sourceControl.disable({ emitEvent: false });
    }
  }

  private presentAlert(header: string, message: string): void {
    this.alertCtrl.create({
      header,
      message,
      buttons: ['确定']
    }).then(alert => alert.present());
  }
}
