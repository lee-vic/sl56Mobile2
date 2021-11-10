import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
@Component({
  selector: 'app-calculation-list',
  templateUrl: './calculation-list.page.html',
  styleUrls: ['./calculation-list.page.scss'],
})
export class CalculationListPage implements OnInit {
  calculateResultList:any;
  tabsData:any;
  currentTabIndex=0;
  constructor(  private router: Router) { }

  ngOnInit() {
    this.calculateResultList=JSON.parse(localStorage.getItem("CalculationResult"));
    let tempData=new Array();
    this.calculateResultList.forEach(element => {
      var tData=null;
      if(tempData.length>0){
        tData=tempData.find(p=>p.PriceType==element.PriceType);
      }
      if(tData==null){
        tData = new Object();
        tData.PriceList = new Array();
        tData.PriceType=element.PriceType;
        tempData.push(tData);
      }
      tData.PriceList.push(element);
    });
    this.tabsData=tempData;
    console.log(this.tabsData);
  }
 
  detail(item){
    localStorage.setItem("CalculationDetail",JSON.stringify(item));
    this.router.navigateByUrl("/member/calculation/calculation-detail");
  }
}
