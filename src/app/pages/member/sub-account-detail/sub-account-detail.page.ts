import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { SubAccount } from 'src/app/interfaces/sub-account';
import { SubAccountService } from 'src/app/providers/sub-account.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-sub-account-detail',
  templateUrl: './sub-account-detail.page.html',
  styleUrls: ['./sub-account-detail.page.scss'],
})
export class SubAccountDetailPage implements OnInit {
  id: number;
  data: SubAccount = new SubAccount();
  title: string;
  isNew: boolean;
  isLoading = false;
  loadError = false;
  isSaving = false;
  isDeleting = false;
  public myForm: FormGroup;

  validation_messages = {
    mobilephone: [
      { type: 'required', message: '手机号码必须输入' },
      { type: 'minlength', message: '手机号码必须为11位' },
      { type: 'maxlength', message: '手机号码必须为11位' }
    ],
    contactname: [
      { type: 'required', message: '姓名必须输入' },
      { type: 'minlength', message: '姓名至少为2位' },
      { type: 'maxlength', message: '姓名不能超过32位' },
    ],
    password: [
      { type: 'required', message: '登录密码不能为空' },
      { type: 'pattern', message: '长度为8-16位并且是字母和数字的组合' }
    ],
    password1: [
      { type: 'pattern', message: '长度为8-16位并且是字母和数字的组合' }
    ],
    discount: [
      { type: 'required', message: '折扣必须输入' },
      { type: 'min', message: '折扣不能小于0.01' },
      { type: 'max', message: '折扣不能大于10' }
    ]
  };

  constructor(
    public navCtrl: NavController,
    private service: SubAccountService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    public formBuilder: FormBuilder,
    private readonly uiFeedbackService: UiFeedbackService
  ) {
    this.id = +(this.route.snapshot.paramMap.get('id') || 0);
    this.isNew = this.id === 0;
    this.title = this.isNew ? '新增子账号' : '编辑子账号';
    this.myForm = this.formBuilder.group({
      mobilephone: ['', Validators.compose([
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11)
      ])],
      contactname: ['', Validators.compose([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(32)
      ])],
      password: [this.isNew ? '' : '1234abcd', Validators.compose([
        Validators.required,
        Validators.pattern('^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$')])],
      password1: ['', Validators.compose([
        Validators.pattern('^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$')])],
      discount: ['', Validators.compose([
        Validators.required,
        Validators.min(0.01),
        Validators.max(10)
      ])],
    });
  }

  ngOnInit(): void {
    if (!this.isNew) {
      this.loadDetail();
    }
  }

  loadDetail(): void {
    this.isLoading = true;
    this.loadError = false;
    this.service.detail(this.id).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: res => {
        this.data = res;
        this.myForm.patchValue({
          mobilephone: res.MobilePhone || '',
          contactname: res.ContactName || '',
          password1: res.Password1 || '',
          discount: res.Discount
        });
      },
      error: () => {
        this.loadError = true;
        this.uiFeedbackService.presentToast('子账号详情加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  onSubmit(formValue): void {
    if (this.myForm.invalid || this.isSaving) {
      this.myForm.markAllAsTouched();
      return;
    }

    const payload: SubAccount = {
      ...this.data,
      MobilePhone: formValue.mobilephone,
      ContactName: formValue.contactname,
      Discount: formValue.discount
    };

    this.isSaving = true;
    const request = this.isNew
      ? this.service.create({ ...payload, Password: formValue.password })
      : this.service.edit({ ...payload, Password1: formValue.password1 });

    request.pipe(
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe({
      next: res => {
        if (res.Success) {
          this.uiFeedbackService.presentToast(this.isNew ? '子账号已新增' : '子账号已保存', 1600, 'middle', undefined, 'success');
          this.navCtrl.back();
          return;
        }
        this.uiFeedbackService.presentToast(res.ErrMsg || '保存失败，请稍后重试', 2400, 'middle', undefined, 'danger');
      },
      error: () => {
        this.uiFeedbackService.presentToast('保存失败，请检查网络后重试', 2400, 'middle', undefined, 'danger');
      }
    });
  }

  delete(): void {
    this.alertCtrl.create({
      header: '删除子账号',
      message: '删除后该成员将无法继续使用此子账号登录，确认继续吗？',
      buttons: [
        {
          text: '取消',
          role: 'cancel',
        },
        {
          text: '删除',
          role: 'destructive',
          handler: () => this.doDelete()
        }
      ]
    }).then(alert => alert.present());
  }

  private doDelete(): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.service.delete(this.id).pipe(
      finalize(() => {
        this.isDeleting = false;
      })
    ).subscribe({
      next: () => {
        this.uiFeedbackService.presentToast('子账号已删除', 1600, 'middle', undefined, 'success');
        this.navCtrl.back();
      },
      error: () => {
        this.uiFeedbackService.presentToast('删除失败，请检查网络后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }
}
