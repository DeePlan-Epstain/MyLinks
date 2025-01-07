import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IMyLinksProps {
  MyLinksIdList: string;
  UsersLinksIdList: string;
  context: WebPartContext;
  NumberOflinks: number;
}
