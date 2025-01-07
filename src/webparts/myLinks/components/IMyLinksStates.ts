export interface IMyLinksStates {
  MyLinks: any[];
  allLinks: any[];
  isLoading: boolean;
  isOpen: boolean;
  stateLinks: any[];
  checked: any[];
  currUserExsit: boolean;
  userPositionList: number;
  user: any;
  InnerModalIsOpen: boolean;

  // Add link, inner modal
  LinkNameNew: string;
  LinkNew: string;
  LinkNewArr: any[];
  LinkNameNewValidationError: boolean;
  LinkNameNewValidationErrorMsg: string;
  LinkNewValidationError: boolean;


}
