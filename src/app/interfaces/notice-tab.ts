import { Notice } from './notice';

export interface NoticeTab {
    categoryId:string;
    currentPageIndex:number;
    items:Notice[];
    title:string;
    isBusy:boolean;
}
