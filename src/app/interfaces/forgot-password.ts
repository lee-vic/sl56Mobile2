export interface ForgotPassword {
    CustomerId:number;
    CompanyId:number
    Mobile:string;
    Code:string;
    Exists:boolean;
    ErrMsg:string;
    Success:boolean;
    NewPassword1:string;
    NewPassword2:string;
}
