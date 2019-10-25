import { Component, OnInit } from '@angular/core';
import { Notice } from 'src/app/interfaces/notice';
import { NoticeService } from 'src/app/providers/notice.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-news-detail',
  templateUrl: './news-detail.page.html',
  styleUrls: ['./news-detail.page.scss'],
})
export class NewsDetailPage implements OnInit {

  id: number;
  notice: Notice;
  ngOnInit(): void {
    this.service.getDetail(this.id).subscribe(res => {
      this.notice = res;
    });
  }

  constructor(
    private service: NoticeService, public activeRoute: ActivatedRoute) {
    this.id = Number(this.activeRoute.snapshot.paramMap.get('id'));
  }
 
}
