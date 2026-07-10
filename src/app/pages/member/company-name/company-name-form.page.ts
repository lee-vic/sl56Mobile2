import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CompanyNameDetail, CompanyNameSaveRequest } from 'src/app/interfaces/company-name';
import { CompanyNameService } from 'src/app/providers/company-name.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-company-name-form',
  templateUrl: './company-name-form.page.html',
  styleUrls: ['./company-name-form.page.scss'],
})
export class CompanyNameFormPage implements OnInit, OnDestroy {
  filingForm: FormGroup;
  currentDetail: CompanyNameDetail | null = null;
  selectedFile: File | null = null;
  selectedFileName = '';
  isEditMode = false;
  isInitializing = false;
  isSubmitting = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: CompanyNameService,
    private readonly uiFeedback: UiFeedbackService
  ) {
    this.filingForm = this.formBuilder.group({
      ObjectId: [0],
      NameType: [0, Validators.required],
      CompanyName: ['', [Validators.required, Validators.maxLength(45), Validators.pattern(/^[A-Za-z ]+$/)]],
      ChineseCompanyName: ['', [Validators.required, Validators.maxLength(256), Validators.pattern(/^[\u4e00-\u9fa5]+$/)]],
      SocialCreditCode: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Z0-9]*$/)]],
      PersonName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z ]+$/)]],
      Phone: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[+0-9-]+$/)]],
      Address1: ['', [Validators.required, Validators.maxLength(35), Validators.pattern(/^[A-Za-z0-9 ]+$/)]],
      Address2: ['', [Validators.maxLength(35), Validators.pattern(/^[A-Za-z0-9 ]*$/)]],
      Address3: ['', [Validators.maxLength(35), Validators.pattern(/^[A-Za-z0-9 ]*$/)]],
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') || 0);
    this.isEditMode = id > 0;
    if (this.isEditMode) {
      this.loadDetail(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      this.selectedFile = null;
      this.selectedFileName = '';
      return;
    }
    if (!/\.(png|jpg|jpeg)$/i.test(file.name)) {
      this.showToast('截图只能是 JPG、JPEG、PNG 格式');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.showToast('文件大小不能超过 1MB');
      input.value = '';
      return;
    }
    this.selectedFile = file;
    this.selectedFileName = file.name;
  }

  saveFiling(): void {
    if (this.filingForm.invalid || this.isSubmitting) {
      this.showToast('请完整填写备案信息');
      return;
    }
    if (!this.isEditMode && !this.selectedFile) {
      this.showToast('请上传资料截图');
      return;
    }

    const model = this.normalizeSaveRequest(this.filingForm.value);
    this.isSubmitting = true;
    const request$ = this.isEditMode
      ? this.service.edit(model, this.selectedFile)
      : this.service.create(model, this.selectedFile as File);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (!res.Success) {
            this.showToast(res.Message || '保存失败');
            return;
          }
          this.service.markListDirty();
          this.showToast(res.Message || '保存成功');
          this.router.navigateByUrl('/member/company-name');
        },
        error: () => {
          this.showToast('保存失败，请稍后重试');
        },
      });
  }

  private loadDetail(id: number): void {
    this.isInitializing = true;
    this.service.getDetail(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isInitializing = false;
        })
      )
      .subscribe({
        next: (detail) => {
          this.currentDetail = detail;
          this.filingForm.patchValue({
            ObjectId: detail.ObjectId,
            NameType: detail.NameType,
            CompanyName: detail.CompanyName,
            ChineseCompanyName: detail.ChineseCompanyName,
            SocialCreditCode: detail.SocialCreditCode,
            PersonName: detail.PersonName,
            Phone: detail.Phone,
            Address1: detail.Address1,
            Address2: detail.Address2,
            Address3: detail.Address3,
          });
        },
        error: () => {
          this.showToast('备案详情加载失败');
          this.router.navigateByUrl('/member/company-name');
        },
      });
  }

  private normalizeSaveRequest(value: CompanyNameSaveRequest): CompanyNameSaveRequest {
    return {
      ObjectId: value.ObjectId || 0,
      NameType: Number(value.NameType || 0),
      CompanyName: String(value.CompanyName || '').trim().toUpperCase(),
      ChineseCompanyName: String(value.ChineseCompanyName || '').trim(),
      SocialCreditCode: String(value.SocialCreditCode || '').trim().toUpperCase(),
      PersonName: String(value.PersonName || '').trim().toUpperCase(),
      Phone: String(value.Phone || '').trim().toUpperCase(),
      Address1: String(value.Address1 || '').trim().toUpperCase(),
      Address2: String(value.Address2 || '').trim().toUpperCase(),
      Address3: String(value.Address3 || '').trim().toUpperCase(),
    };
  }

  private async showToast(message: string): Promise<void> {
    await this.uiFeedback.presentToast(message, 1800, 'middle');
  }
}
