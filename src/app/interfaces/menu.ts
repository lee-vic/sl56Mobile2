export class Menu {
    title:string;
    image:string;
    url:string;
    type:Array<number>;
}
export class MenuRow{
    items:Array<Menu>;
}
export class Menus{
    rows:Array<MenuRow>;
}