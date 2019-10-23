import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage  implements OnInit {
  
  tab="1";
  currentProduct:number=1;
  @ViewChild('DHL',{static: false}) DHLElement:ElementRef;
  @ViewChild('FedEx',{static: false}) FedExElement:ElementRef;
  @ViewChild('UPS',{static: false}) UPSElement:ElementRef;
  @ViewChild('TNT',{static: false}) TNTElement:ElementRef;
  @ViewChild(IonContent,{static: false}) content;
  constructor(public activeRoute: ActivatedRoute) {}
  ngOnInit(): void {
      this.tab=this.activeRoute.snapshot.paramMap.get('id');

  }

 
  gotoDHL(){
    this.content.scrollToPoint(0,this.DHLElement.nativeElement.offsetTop,500);
    this.currentProduct=1;
  }
  gotoFedEx(){
    this.content.scrollToPoint(0,this.FedExElement.nativeElement.offsetTop,500);
    this.currentProduct=2;
  }
  gotoUPS(){
    this.content.scrollToPoint(0,this.UPSElement.nativeElement.offsetTop,500);
    this.currentProduct=3;
  }
  gotoTNT(){
    this.content.scrollToPoint(0,this.TNTElement.nativeElement.offsetTop,500);
    this.currentProduct=4;
  }

}
