import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, IonContent } from '@ionic/angular';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDetail, ForwardingDocumentItem } from 'src/app/interfaces/import-manifest';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    public service: ImportManifestService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.id = +this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.loadDetail();
    }
  }

  loadDetail() {
    this.isLoading = true;
    this.hasError = false;
    this.service.getDetail(this.id).subscribe({
      next: (res) => {
        this.data = res;
        // Load forwarding documents if available
        if (res.ObjectId && res.ForwardingDocumentCount > 0) {
          this.service.getForwardingDocuments(res.ObjectId).subscribe({
            next: (docRes) => {
              if (docRes.success) {
                this.attachments = docRes.rows || [];
              }
              this.isLoading = false;
            },
            error: () => {
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
    switch (status) {
      case 0: return 'warning';
      case 1: return 'success';
      case 2: return 'danger';
      default: return 'medium';
    }
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'document-outline';
      case 'jpg': case 'jpeg': case 'png': return 'image-outline';
      case 'doc': case 'docx': return 'document-text-outline';
      case 'xls': case 'xlsx': return 'grid-outline';
      default: return 'attach-outline';
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
