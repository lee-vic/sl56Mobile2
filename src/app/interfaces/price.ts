export interface PriceInfo{
    Name:string;
    ModeOfTransportName:string;
    StartDate:string;
    EndDate:string;
    Currency:string;
}
export interface PriceInfoList{
    AllowDownloadPrice:boolean;
    Items:PriceInfo[];
}