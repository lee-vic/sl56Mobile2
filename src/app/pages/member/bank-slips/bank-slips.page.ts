import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlertController, IonInfiniteScroll, NavController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { apiUrl } from 'src/app/global';
import { BankSlips } from 'src/app/interfaces/bank-slips';
import { BankSlipsService } from 'src/app/providers/bank-slips.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-bank-slips',
  templateUrl: './bank-slips.page.html',
  styleUrls: ['./bank-slips.page.scss'],
})
export class BankSlipsPage implements OnInit {
  private readonly pageSize = 15;

  public form: FormGroup;
  @ViewChild('fileInput', { static: true }) fileInput: ElementRef<HTMLInputElement>;
  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;

  isBusy = false;
  isInitialLoading = false;
  isLoaded = false;
  loadError = false;
  isUploading = false;
  currentPageIndex = 1;
  items: BankSlips[] = [];

  constructor(
    public navCtrl: NavController,
    public formBuilder: FormBuilder,
    public service: BankSlipsService,
    public alertCtrl: AlertController,
    private readonly uiFeedbackService: UiFeedbackService
  ) {
    this.form = this.formBuilder.group({
      file: null
    });
  }

  ngOnInit(): void {
    this.refreshList();
  }

  onFileChange(event: Event): void {
    if (this.isUploading) {
      return;
    }

    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    this.isUploading = true;

    reader.onload = () => {
      const fileContent = String(reader.result);
      this.form.get('file').setValue({
        name: file.name,
        type: file.type,
        value: fileContent.split(',')[1]
      });

      this.service.upload(this.form.value.file).pipe(
        finalize(() => {
          this.isUploading = false;
          input.value = '';
        })
      ).subscribe({
        next: res => {
          if (res.Success) {
            this.uiFeedbackService.presentToast('水单已上传', 1600, 'middle', undefined, 'success');
            this.refreshList();
            return;
          }
          this.uiFeedbackService.presentToast(res.ErrMsg || '上传失败，请稍后重试', 2400, 'middle', undefined, 'danger');
        },
        error: () => {
          this.uiFeedbackService.presentToast('上传失败，请检查网络后重试', 2400, 'middle', undefined, 'danger');
        }
      });
    };

    reader.onerror = () => {
      this.isUploading = false;
      input.value = '';
      this.uiFeedbackService.presentToast('读取文件失败，请重新选择', 2200, 'middle', undefined, 'danger');
    };

    reader.readAsDataURL(file);
  }

  doSubmit(): void {
    if (this.isUploading) {
      return;
    }
    this.fileInput.nativeElement.click();
  }

  getItems(event?: CustomEvent): void {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    this.loadError = false;
    this.service.getList(this.currentPageIndex).pipe(
      finalize(() => {
        this.isBusy = false;
        this.isInitialLoading = false;
        this.isLoaded = true;
        this.completeEvent(event);
      })
    ).subscribe({
      next: res => {
        if (res.length < this.pageSize && this.infiniteScroll) {
          this.disableInfiniteScroll();
        }
        res.forEach(item => {
          item.Url = `${apiUrl}/UploadBankSlips/Detail/${item.Id}`;
          this.items.push(item);
        });
        this.currentPageIndex++;
      },
      error: () => {
        this.loadError = true;
        this.uiFeedbackService.presentToast('水单列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  refresh(event?: CustomEvent): void {
    this.refreshList(event);
  }

  delete(id: number): void {
    this.alertCtrl.create({
      header: '删除水单',
      message: '删除后该付款凭证将不再展示，确认继续吗？',
      buttons: [
        {
          text: '取消',
          role: 'cancel'
        },
        {
          text: '删除',
          role: 'destructive',
          handler: () => {
            this.doDelete(id);
          }
        }
      ]
    }).then(alert => alert.present());
  }

  doDelete(id: number): void {
    this.service.delete(id).subscribe({
      next: res => {
        if (!res.Success) {
          this.uiFeedbackService.presentToast(res.ErrMsg || '删除失败，请稍后重试', 2200, 'middle', undefined, 'danger');
          return;
        }
        this.uiFeedbackService.presentToast('水单已删除', 1600, 'middle', undefined, 'success');
        this.refreshList();
      },
      error: () => {
        this.uiFeedbackService.presentToast('删除失败，请检查网络后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  refreshList(event?: CustomEvent): void {
    this.isInitialLoading = this.items.length === 0;
    this.loadError = false;
    this.currentPageIndex = 1;
    this.items = [];
    this.enableInfiniteScroll();
    this.getItems(event);
  }

  trackBySlipId(_index: number, item: BankSlips): number {
    return item.Id;
  }

  getStatusColor(status: string): string {
    if (status === '已收款') {
      return 'success';
    }
    if (status === '已删除' || status === '已驳回') {
      return 'medium';
    }
    return 'primary';
  }

  private completeEvent(event?: CustomEvent): void {
    const target = event?.target as HTMLIonRefresherElement | HTMLIonInfiniteScrollElement;
    if (target && typeof target.complete === 'function') {
      target.complete();
      return;
    }
    if (this.infiniteScroll) {
      this.infiniteScroll.complete();
    }
  }

  private disableInfiniteScroll(): void {
    if (!this.infiniteScroll) return;
    const infiniteScroll = this.infiniteScroll as IonInfiniteScroll & { setDisabled?: (disabled: boolean) => void };
    if (typeof infiniteScroll.setDisabled === 'function') {
      infiniteScroll.setDisabled(true);
      return;
    }
    this.infiniteScroll.disabled = true;
  }

  private enableInfiniteScroll(): void {
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
  }
}
