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

  invoicePath: string;
  rgdId: number;
  problemId: number;
  isWeAppFile: boolean;

  constructor(private route: ActivatedRoute, private router: Router, private navCtrl: NavController) {
    this.route.queryParams.subscribe(p => {
      this.rgdId = p.rgdId;
      this.problemId = p.problemId;
      this.isWeAppFile = p.isWeAppFile;
      let previewPath = encodeURI(apiUrl + "/Problem/PreviewInvoice?path=" + p.filePath + "#page=1");
      this.invoicePath =previewPath;
      console.log(previewPath);
    });
  }

  ngOnInit() {
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
