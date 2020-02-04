import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage  {

  news = [
    {
      title: "公司通知",
      description: "升蓝重要通知",
      image: "assets/imgs/home-news-1.png",
      cateId: 2
    },
    {
      title: "业务信息",
      description: "升蓝最新信息",
      image: "assets/imgs/home-news-2.png",
      cateId: 3
    },
    {
      title: "关于我们",
      description: "升蓝介绍",
      image: "assets/imgs/home-news-2.png"
    }
  ];
  slides = [
    {
      image: "assets/imgs/home-slidebox-1.png",
    },
    {
      image: "assets/imgs/home-slidebox-2.png",
    },
    {
      image: "assets/imgs/home-slidebox-3.png",
    },
    {
      image: "assets/imgs/home-slidebox-4.png",
    }
  ];
  products = [
    {
      image: "assets/imgs/home-product-1.png",
      product: "1"
    },
    {
      image: "assets/imgs/home-product-2.png",
      product: "2"
    },
    {
      image: "assets/imgs/home-product-3.png",
      product: "3"
    }
  ]
  constructor(private router: Router) {}
  openProduct(prod) {
    this.router.navigate(["/app/tabs/product",prod.product]);
  }
  openNews(item) {
    this.router.navigate(["/app/tabs/news",item.cateId]);
  }

}
