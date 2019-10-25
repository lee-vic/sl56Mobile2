export interface Problem{
    Id:Number;
    No:string;
    ProblemList:Array<ProblemDetail>;
}
export interface ProblemDetail{
    ObjectId:Number;
    ObjectName:string;
}