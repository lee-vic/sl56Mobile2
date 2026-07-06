export interface CurrencyAmount {
    Id:number;
    Name:string;
    Amount:string | number;
}

export interface User {
    Amount:string;
    PendingConfirmationCount:number;
    ProblemShipmentCount:number;
    UnReadMessageCount:number;
    NoticeUnreadCount:number;
    CustomerId:number;
    CustomerNo:string;
    Classify:number;
    CurrencyAmount: Array<CurrencyAmount>;
    WaitToSignTaskCount:number;
}
