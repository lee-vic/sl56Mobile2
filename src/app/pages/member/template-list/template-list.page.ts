import { Component, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll, NavController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { apiUrl } from 'src/app/global';
import { Template } from 'src/app/interfaces/template';
import { TemplateService } from 'src/app/providers/template.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.page.html',
  styleUrls: ['./template-list.page.scss'],
})
export class TemplateListPage implements OnInit {
  private readonly pageSize = 15;

  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;

  currentPageIndex = 1;
  items: Template[] = [];
  isBusy = false;
  isInitialLoading = false;
  isLoaded = false;
  loadError = false;

  constructor(
    public navCtrl: NavController,
    private service: TemplateService,
    private readonly uiFeedbackService: UiFeedbackService
  ) {
  }

  ngOnInit(): void {
    this.refreshList();
  }

  getItems(event?: CustomEvent): void {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    this.loadError = false;
    this.service.getList(this.currentPageIndex).pipe(
      finalize(() => {
        this.isBusy = false;
        this.isInitialLoading = false;
        this.isLoaded = true;
        this.completeEvent(event);
      })
    ).subscribe({
      next: res => {
        if (res.length < this.pageSize) {
          this.disableInfiniteScroll();
        }
        res.forEach(item => {
          item.Url = `${apiUrl}/Template/Download/${item.Id}`;
          this.items.push(item);
        });
        this.currentPageIndex++;
      },
      error: () => {
        this.loadError = true;
        this.uiFeedbackService.presentToast('模板列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  refresh(event?: CustomEvent): void {
    this.refreshList(event);
  }

  refreshList(event?: CustomEvent): void {
    this.isInitialLoading = this.items.length === 0;
    this.loadError = false;
    this.currentPageIndex = 1;
    this.items = [];
    this.enableInfiniteScroll();
    this.getItems(event);
  }

  trackByTemplateId(_index: number, item: Template): number {
    return item.Id;
  }

  private completeEvent(event?: CustomEvent): void {
    const target = event?.target as HTMLIonRefresherElement | HTMLIonInfiniteScrollElement;
    if (target && typeof target.complete === 'function') {
      target.complete();
      return;
    }
    if (this.infiniteScroll) {
      this.infiniteScroll.complete();
    }
  }

  private disableInfiniteScroll(): void {
    if (!this.infiniteScroll) return;
    const infiniteScroll = this.infiniteScroll as IonInfiniteScroll & { setDisabled?: (disabled: boolean) => void };
    if (typeof infiniteScroll.setDisabled === 'function') {
      infiniteScroll.setDisabled(true);
      return;
    }
    this.infiniteScroll.disabled = true;
  }

  private enableInfiniteScroll(): void {
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
  }
}
