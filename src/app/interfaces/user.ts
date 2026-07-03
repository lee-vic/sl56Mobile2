export interface CurrencyAmount {
    Id:number;
    Name:string;
    Amount:string | number;
}

export interface User {
    Amount:string;
    Quantity1:string | number;
    Quantity2:string | number;
    UnReadMessageCount:number;
    CustomerId:number;
    CustomerNo:string;
    Classify:number;
    CurrencyAmount: Array<CurrencyAmount>;
    WaitToSignTaskCount:number;
}
