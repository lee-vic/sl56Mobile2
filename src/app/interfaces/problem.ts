export interface Problem{
    Id:Number;
    No:string;
    ProblemList:Array<ProblemDetail>;
}
export interface ProblemDetail{
    ObjectId:Number;
    ObjectName:string;
}

//自助处理问题结果
export interface ProblemProcessResultModel{
    ProcessTypes:string;
    Id:number;
    Type1Result:ProblemProcessType1ResultModel;
    Type2Result:ProblemProcessType2ResultModel;
    Type3Result:ProblemProcessType3ResultModel;
    Type4Result:ProblemProcessType4ResultModel;
}

//单选结果
interface ProblemProcessType1ResultModel{
    Value:string
}

//填写内容
interface ProblemProcessType2ResultModel{
    Items:Array<ProblemProcessType2ItemResultModel>
}
export class ProblemProcessType2ItemResultModel{
    Name:string;
    Value:string
}

//上传文件
interface ProblemProcessType3ResultModel{
    Value:string;
    AttachmentTypeId:string;
    FileName:string
}

//多选结果
interface ProblemProcessType4ResultModel{
    Values:Array<string>
}