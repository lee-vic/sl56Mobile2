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
    let emptyObj = new Object();
    tempData.push(emptyObj);
    this.calculateResultList.forEach(element => {
      let tData=null;
      if(tempData.length>0){
        tData=tempData.find(p=>p.PriceType==element.PriceType);
      }
      if(tData==null){
        tData = new Object();
        tData.PriceList = new Array();
        tData.PriceType=element.PriceType;
        //若存在出口价，则把出口价显示在第一个选项卡
        if(element.PriceType=="出口价")
        {
          tempData[0]=tData;
        }else{
          tempData.push(tData);
        }
      }
      tData.PriceList.push(element);
    });
    if(tempData[0]==emptyObj){
      tempData.splice(0,1);
    }
    this.tabsData=tempData;
    console.log(this.tabsData);
  }
 
  detail(item){
    localStorage.setItem("CalculationDetail",JSON.stringify(item));
    this.router.navigateByUrl("/member/calculation/calculation-detail");
  }
}
