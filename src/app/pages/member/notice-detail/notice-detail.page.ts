import { Component, OnInit } from '@angular/core';
import { Notice } from 'src/app/interfaces/notice';
import { NoticeService } from 'src/app/providers/notice.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-notice-detail',
  templateUrl: './notice-detail.page.html',
  styleUrls: ['./notice-detail.page.scss'],
})
export class NoticeDetailPage implements OnInit {

  id:number;
  notice:Notice;
  ngOnInit(): void {
    this.service.getDetail(this.id).subscribe(res=>{
      this.notice=res;
    });
  }

  constructor(
    private service:NoticeService,
    private route: ActivatedRoute
    ) {
      this.id = +this.route.snapshot.paramMap.get('id');
  }


}
