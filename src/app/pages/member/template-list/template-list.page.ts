import { Component, OnInit, ViewChild } from '@angular/core';
import { apiUrl } from 'src/app/global';
import { Template } from 'src/app/interfaces/template';
import { NavController, IonInfiniteScroll } from '@ionic/angular';
import { TemplateService } from 'src/app/providers/template.service';

@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.page.html',
  styleUrls: ['./template-list.page.scss'],
})
export class TemplateListPage implements OnInit {
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  currentPageIndex: number = 1;
  items: Template[] = [];
  isBusy: boolean = false;
  constructor(public navCtrl: NavController, 
    private service:TemplateService,
    ) {
  }
  ngOnInit(): void {
    this.getItems(null);
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad TemplateListPage');
  }
  getItems(ev) {
    if (this.isBusy == true)
      return;
    this.isBusy = true;
    this.service.getList(this.currentPageIndex).subscribe(res => {
    
      if (res.length < 15) {
        this.infiniteScroll.disabled=true;
      }
      for (var i = 0; i < res.length; i++) {
        res[i].Url=apiUrl + "/Template/Download/"+res[i].Id;
        this.items.push(res[i]);
      }
      this.currentPageIndex++;
      if (ev != null)
      this.infiniteScroll.complete();
      this.isBusy = false;
    });
  }
}
