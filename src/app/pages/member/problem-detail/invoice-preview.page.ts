import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { apiUrl } from '../../../global';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-invoice-preview',
  templateUrl: './invoice-preview.page.html',
  styleUrls: ['./invoice-preview.page.scss']
})
export class InvoicePreviewPage implements OnInit {

  invoiceSrc: any;
  rgdId: number;
  problemId: number;
  isWeAppFile: boolean;
  currentPage: number = 1;
  totalPages: number = 0;
  loadFailed: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router, private navCtrl: NavController) {
    this.route.queryParams.subscribe(p => {
      this.rgdId = p.rgdId;
      this.problemId = p.problemId;
      this.isWeAppFile = p.isWeAppFile;
      const previewPath = apiUrl + "/Problem/PreviewInvoice?path=" + encodeURIComponent(p.filePath || "");
      // ng2-pdf-viewer跨域/跨子域取文件时需要显式开启凭据
      this.invoiceSrc = {
        url: previewPath,
        withCredentials: true
      };
      this.loadFailed = false;
      console.log(previewPath);
    });
  }

  ngOnInit() {
  }

  onPdfLoaded(pdf: any) {
    this.totalPages = pdf && pdf.numPages ? pdf.numPages : 0;
    this.currentPage = 1;
    this.loadFailed = false;
  }

  onPdfError(err: any) {
    console.error('PDF load failed:', err);
    this.loadFailed = true;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.totalPages > 0 && this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  reSelect() {
    let params: NavigationExtras = {
      queryParams: {
        problemid: this.problemId
      },
      state: {
        confirmFile: false,
        isWeAppFile: this.isWeAppFile,
        refresh: Date.now()
      }
    }
    console.log("confirm:false.goto:", '/member/problem-detail/' + this.rgdId, params);
    this.navCtrl.navigateBack('/member/problem-detail/' + this.rgdId, params)
  }
  confirm() {
    let params: NavigationExtras = {
      queryParams: {
        problemid: this.problemId
      },
      state: {
        confirmFile: true,
        isWeAppFile: this.isWeAppFile,
      }
    }
    this.navCtrl.navigateBack('/member/problem-detail/' + this.rgdId, params)
  }

}
