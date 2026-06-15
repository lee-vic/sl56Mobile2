import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, IonContent } from '@ionic/angular';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDomainService } from 'src/app/providers/import-manifest-domain.service';
import { ImportManifestDetail, ForwardingDocumentItem, BatteryModelOption } from 'src/app/interfaces/import-manifest';

@Component({
  selector: 'app-import-manifest-detail',
  templateUrl: './import-manifest-detail.page.html',
  styleUrls: ['./import-manifest-detail.page.scss'],
})
export class ImportManifestDetailPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content: IonContent;

  id: number;
  data: ImportManifestDetail | null = null;
  attachments: ForwardingDocumentItem[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  readonly skeletonInfoCards = [
    { rows: [1, 2, 3, 4, 5] },
    { rows: [1, 2, 3, 4] },
    { rows: [1, 2, 3] },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    public service: ImportManifestService,
    public domain: ImportManifestDomainService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.id = +this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.loadDetail();
    }
    this.service.getBatteryModelOptions().subscribe({
      next: (opts) => { this.batteryModelOptions = opts || []; }
    });
  }

  loadDetail() {
    this.isLoading = true;
    this.hasError = false;
    this.service.getDetail(this.id).subscribe({
      next: (res) => {
        this.data = res;
        if (res.ObjectId) {
          this.service.getForwardingDocuments(res.ObjectId).subscribe({
            next: (docRes) => {
              if (docRes.success) {
                this.attachments = docRes.rows || [];
                if (this.data) this.data.ForwardingDocumentCount = this.attachments.length;
              } else {
                this.attachments = [];
                if (this.data) this.data.ForwardingDocumentCount = 0;
              }
              this.isLoading = false;
            },
            error: () => {
              this.attachments = [];
              this.isLoading = false;
            },
          });
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  edit() {
    if (this.data && this.data.Status === 0) {
      this.router.navigate(['/member/import-manifest/form', this.id]);
    }
  }

  async confirmDelete() {
    if (!this.data || this.data.Status !== 0) return;

    const alert = await this.alertCtrl.create({
      header: '确认删除',
      message: `确定要删除预报 "${this.data.ObjectNo}" 吗？此操作不可撤销。`,
      buttons: [
        { text: '取消', role: 'cancel' },
        {
          text: '删除',
          role: 'destructive',
          handler: () => {
            this.performDelete();
          },
        },
      ],
    });
    await alert.present();
  }

  private performDelete() {
    this.service.delete(this.id).subscribe({
      next: (res) => {
        if (res.Success) {
          this.service.markListDirty();
          this.navCtrl.back();
        } else {
          this.showAlert('删除失败', res.ErrMsg);
        }
      },
      error: () => {
        this.showAlert('错误', '网络错误，请稍后重试');
      },
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['确定'] });
    await alert.present();
  }

  getStatusColor(status: number): string {
    return this.domain.getStatusColor(status);
  }

  getCustomerStatusName(): string {
    return this.domain.getCustomerStatusName(this.data?.StatusName);
  }

  getBatteryModelText(): string {
    if (!this.batteryModelOptions.length) return '';
    const opt = this.batteryModelOptions.find(o => o.Value === (this.data?.BatteryModel || ''));
    return opt ? opt.Text : '';
  }

  // Battery model options (fetched from API, single source of truth)
  batteryModelOptions: BatteryModelOption[] = [];

  getFileIcon(fileName: string): string {
    return this.domain.getFileIcon(fileName);
  }

  previewDocument(doc: ForwardingDocumentItem) {
    if (!doc || !doc.id) return;
    this.service.openForwardingDocumentPreview(doc.id);
  }

  downloadDocument(doc: ForwardingDocumentItem) {
    if (!doc || !doc.id) return;
    this.service.downloadForwardingDocument(doc.id);
  }

  downloadLabel() {
    if (!this.data || !this.data.ObjectId) return;
    this.service.downloadLabel(this.data.ObjectId);
  }

  formatFileSize(bytes: number): string {
    return this.domain.formatFileSize(bytes);
  }
}
