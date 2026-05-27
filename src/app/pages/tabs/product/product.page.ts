import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage  implements OnInit {
  tab = '1';
  currentProduct = 1;

  constructor(public activeRoute: ActivatedRoute) {}

  ngOnInit(): void {
    const routeTab = this.activeRoute.snapshot.paramMap.get('id');
    if (routeTab) {
      this.tab = routeTab;
    }
  }

  selectExpress(carrier: number) {
    if (carrier < 1 || carrier > 4) {
      return;
    }

    this.currentProduct = carrier;
  }

  gotoDHL() {
    this.selectExpress(1);
  }

  gotoFedEx() {
    this.selectExpress(2);
  }

  gotoUPS() {
    this.selectExpress(3);
  }

  gotoTNT() {
    this.selectExpress(4);
  }
}
