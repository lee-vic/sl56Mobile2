import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, IonContent } from '@ionic/angular';
import { ImportManifestService } from 'src/app/providers/import-manifest.service';
import { ImportManifestDetail } from 'src/app/interfaces/import-manifest';

@Component({
  selector: 'app-import-manifest-detail',
  templateUrl: './import-manifest-detail.page.html',
  styleUrls: ['./import-manifest-detail.page.scss'],
})
export class ImportManifestDetailPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content: IonContent;

  id: number;
  data: ImportManifestDetail | null = null;
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
        this.isLoading = false;
        this.data = res;
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
}
