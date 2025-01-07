import * as React from 'react';
import styles from './MyLinks.module.scss';
import "./MyLinks.css"
import type { IMyLinksProps } from './IMyLinksProps';
import { IMyLinksStates } from './IMyLinksStates';
import { spfi, SPFx, SPFI } from "@pnp/sp";
import getSP from '../../PnPjsConfig';
import Modal from '@mui/material/Modal';
import { Box, Button, Divider, TextField, Tooltip, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import LinkIcon from '@mui/icons-material/Link';
import AddLinkIcon from '@mui/icons-material/AddLink';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';

const style = {
  position: 'absolute' as 'relative',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '40%',
  bgcolor: 'background.paper',
  borderRadius: '5px',
  boxShadow: 24,
  // p: 40,
};
const InnerModalstyle = {
  position: 'absolute' as 'relative',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '35%',
  bgcolor: 'background.paper',
  borderRadius: '5px',
  boxShadow: 24,
  // p: 40,
};

export default class MyLinks extends React.Component<IMyLinksProps, IMyLinksStates> {
  public sp: SPFI

  constructor(props: IMyLinksProps) {
    super(props);
    this.state = {
      MyLinks: [],
      allLinks: [],
      stateLinks: [],
      isLoading: true,
      isOpen: false,
      checked: [],
      currUserExsit: false,
      userPositionList: 0,
      user: null,
      InnerModalIsOpen: false,

      // Add link, inner modal
      LinkNameNew: "",
      LinkNew: "",
      LinkNewArr: [],
      LinkNameNewValidationError: false,
      LinkNameNewValidationErrorMsg: "",
      LinkNewValidationError: false
    };
  }

  componentDidMount(): void {
    console.clear()
    this.sp = getSP(this.props.context)

    this.getList()
  }

  getList = async () => {
    const user = await this.sp.web.currentUser()
    const allLinks = await this.sp.web.lists.getById(this.props.UsersLinksIdList).items.top(this.props.NumberOflinks).getAll()
    const items = await this.sp.web.lists.getById(this.props.MyLinksIdList).items()
    let i = items.filter(item => {
      return item.UsernameId === user.Id
    })
    if (i.length > 0) {
      this.setState({
        currUserExsit: true,
        userPositionList: i[0].Id,
        MyLinks: JSON.parse(i[0]?.Links),
        stateLinks: JSON.parse(i[0]?.Links),
        checked: JSON.parse(i[0]?.Links),
        LinkNewArr: JSON.parse(i[0]?.MainListLinks) || []
      })
    }
    this.setState({
      user: user,
      isLoading: false,
      allLinks: allLinks,
    })
  }

  // Generic onChange
  onChange = (e: any) => {
    const { name, value } = e.target;

    // if (name === "LinkNew") {
    //   this.setState(({
    //     LinkNewValidationError: value === ""
    //   }));
    // }
    // if (name === "LinkNameNew") {
    //   this.setState(({
    //     LinkNameNewValidationError: value === "" || value === undefined
    //   }));
    // }

    this.setState({
      [name]: value === "" ? null : value,

    } as Pick<IMyLinksStates, keyof IMyLinksStates>);
  };

  handleClose = () => {
    this.setState({ isOpen: !this.state.isOpen })
  }

  handleCloseInnerModal = () => {
    this.setState({
      InnerModalIsOpen: !this.state.InnerModalIsOpen,
      LinkNewValidationError: false,
      LinkNameNewValidationError: false,
      LinkNew: "",
      LinkNameNew: ""
    })
  }

  handleOpen = () => {
    this.setState({ isOpen: !this.state.isOpen, checked: this.state.MyLinks })
  }

  updateList = (LinkName: string) => {
    this.setState({
      stateLinks: [...this.state.stateLinks, LinkName]
    })

  }

  filterList = (linkName: string) => {
    const items = this.state.stateLinks.filter(item => item === linkName)
    return items.length === 0
  }

  handleToggle = (index: number, value: any) => () => {
    if (value.LinkName !== 'רכבים וכלי צמ"ה') {
      // First, let's see if the item is already in the 'checked' list.
      const currentIndex = this.state.checked.findIndex((item) => item.LinkName === value.LinkName);

      // Copy the current 'checked' state to avoid direct state mutation.
      const newChecked = [...this.state.checked];

      if (currentIndex === -1) {
        // If the item isn't found, add it to the 'checked' array.
        newChecked.push(value);
      } else {
        // If the item is found, remove it from the 'checked' array.
        newChecked.splice(currentIndex, 1);
      }

      // Update the state with the new 'checked' array.
      this.setState({
        checked: newChecked,
      });
    }
  };

  syncToMyLinks = () => {

    if (this.state.currUserExsit) {

      this.sp.web.lists.getById(this.props.MyLinksIdList).items.getById(this.state.userPositionList).update({
        Links: JSON.stringify(this.state.checked)
      })
    } else {
      this.sp.web.lists.getById(this.props.MyLinksIdList).items.add({
        Links: JSON.stringify(this.state.checked),
        UsernameId: this.state.user.Id,
      })
      this.setState({ currUserExsit: true })
    }
    this.setState({
      MyLinks: this.state.checked,
      isOpen: false
    })
  }

  removeItem = (i: any) => {

    let array = this.state.MyLinks.filter(item => i.LinkName !== item.LinkName)

    this.setState({
      MyLinks: array,
      checked: array
    })
    if (this.state.currUserExsit) {

      // this.sp.web.lists.getById(this.props.MyLinksIdList).items.getById(this.state.userPositionList).update({
      //   Links: JSON.stringify(array)
      // })
    } else {
      this.sp.web.lists.getById(this.props.MyLinksIdList).items.add({
        Links: JSON.stringify(array),
        UsernameId: this.state.user.Id
      })
    }
  }

  removeItemFromCombineArray = (i: any) => {

    let array = this.state.LinkNewArr.filter(item => i != item)
    this.setState({
      LinkNewArr: array,
      // checked: [...this.state.checked, ...array]
    })

    if (this.state.MyLinks.filter(item => i.LinkName === item.LinkName).length > 0) {
      let array = this.state.MyLinks.filter(item => i.LinkName !== item.LinkName)

      this.setState({
        MyLinks: array,
        // checked: array
      })
    }

    let Mylinks = this.state.MyLinks.filter(item => i.LinkName !== item.LinkName)

    if (this.state.currUserExsit) {
      this.sp.web.lists.getById(this.props.MyLinksIdList).items.getById(this.state.userPositionList).update({
        MainListLinks: JSON.stringify(array),
        Links: JSON.stringify(Mylinks)
      })
    } else {
      this.sp.web.lists.getById(this.props.MyLinksIdList).items.add({
        MainListLinks: JSON.stringify(array),
        Links: JSON.stringify(Mylinks),
        UsernameId: this.state.user.Id
      })
    }
  }

  HandleToNewLinks = () => {
    if (this.validateForm()) {

      let item = {
        LinkName: this.state.LinkNameNew,
        Title: this.state.LinkNew,
        Flag: true
      }
      let arr = [...this.state.LinkNewArr, item]

      if (this.state.currUserExsit) {
        this.sp.web.lists.getById(this.props.MyLinksIdList).items.getById(this.state.userPositionList).update({
          MainListLinks: JSON.stringify(arr)
        })
      } else {
        this.sp.web.lists.getById(this.props.MyLinksIdList).items.add({
          MainListLinks: JSON.stringify(arr),
          UsernameId: this.state.user.Id
        })
      }

      this.setState({ LinkNewArr: arr })
      this.setState({ InnerModalIsOpen: false, LinkNew: "", LinkNameNew: "" })
    }
  }

  validateForm = (): boolean => {
    let isValid = true;

    // Reset validation errors
    this.setState(({
      LinkNewValidationError: false,
      LinkNameNewValidationError: false
    }));

    if (this.state.LinkNew === "" || this.state.LinkNew === undefined || this.state.LinkNew === null) {
      isValid = false;
      this.setState(({
        LinkNewValidationError: true,
      }));
    }
    const combineArray = [...this.state.allLinks, ...this.state.LinkNewArr]
    if (combineArray.filter(i => i.LinkName === this.state.LinkNameNew).length > 0) {

      isValid = false
      this.setState({
        LinkNameNewValidationError: true,
        LinkNameNewValidationErrorMsg: 'שם הלינק כבר קיים ברשימה'
      })
    }

    if (this.state.LinkNameNew === "" || this.state.LinkNameNew === undefined || this.state.LinkNameNew === null) {
      isValid = false;
      this.setState(({
        LinkNameNewValidationError: true,
        LinkNameNewValidationErrorMsg: 'נא למלא את כל שדות החובה'
      }));
    }

    return isValid
  }

  public render(): React.ReactElement<IMyLinksProps> {

    const combineArray = [...this.state.allLinks, ...this.state.LinkNewArr]

    return (

      <div>
        {this.state.isLoading ? (
          <div className="SpinnerComp">
            <div className="loading-screen">
              <div className="loader-wrap">
                <span className="loader-animation"></span>
                <div className="loading-text">
                  <span className="letter">ב</span>
                  <span className="letter">ט</span>
                  <span className="letter">ע</span>
                  <span className="letter">י</span>
                  <span className="letter">נ</span>
                  <span className="letter">ה</span>
                </div>
              </div>
            </div>
          </div>)

          : <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Modal open={this.state.isOpen} onClose={this.handleClose} >
              <Box sx={style}>
                <div className={styles.ModalHeader}>
                  <span style={{ fontSize: '25px', fontWeight: 'bold', marginRight: '0.5rem' }}>קישורים לבחירה</span>
                  <Button variant="text" color="primary" onClick={() => this.setState({ InnerModalIsOpen: true })}>
                    <AddLinkIcon />
                  </Button>
                </div>
                <Divider />
                <div dir='ltr' className={styles.ModalStyle}>

                  <List dir='rtl' sx={{ width: '97%', bgcolor: 'background.paper', overflowY: 'scroll', maxHeight: '300px', paddingLeft: '3%' }}>
                    {combineArray.map((value, index) => {
                      const labelId = `checkbox-list-label-${value}`;
                      {

                      }
                      return (
                        <ListItem
                          dir='rtl'
                          style={{ paddingRight: '0 !important' }}
                          className={styles.listItem}
                          key={uuidv4()}
                          secondaryAction={
                            <IconButton edge="end" aria-label="comments">
                              {/* <CommentIcon /> */}
                            </IconButton>
                          }
                          disablePadding
                        >
                          <ListItemButton dir='rtl' role={undefined} onClick={this.handleToggle(index, value)} dense>
                            <ListItemIcon dir='rtl'>
                              <Checkbox dir='rtl'
                                edge="start"
                                checked={this.state.checked.filter((item: any) => { return item.LinkName === value.LinkName }).length > 0}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': labelId }}
                              />
                            </ListItemIcon>
                            <ListItemText style={{ display: 'flex' }} id={labelId} primary={value?.LinkName} />
                            {value?.Flag && <DeleteIcon onClick={(e) => { e.stopPropagation(), this.removeItemFromCombineArray(value) }}></DeleteIcon>}
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                  <Divider />
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
                    <Button variant="text" color="primary" onClick={() => this.syncToMyLinks()}>
                      אישור
                    </Button>
                  </div>
                </div>
              </Box>
            </Modal>
            <Modal open={this.state.InnerModalIsOpen} onClose={this.handleCloseInnerModal}>
              <Box sx={InnerModalstyle}>
                <div className={styles.ModalHeader}>
                  <span style={{ fontSize: '25px', fontWeight: 'bold', marginRight: '0.5rem' }}>צור קישור חדש</span>
                </div>
                <Divider />
                <div style={{ padding: '1rem 1rem 0 1rem' }}>

                  <Typography id="modal-modal-title" variant="subtitle1" color='GrayText' fontStyle='inherit' component="h6">שם הקישור:</Typography>
                  <TextField
                    id=""
                    value={this.state.LinkNameNew}
                    onChange={this.onChange}
                    type='text'
                    fullWidth
                    required
                    error={this.state.LinkNameNewValidationError}
                    helperText={this.state.LinkNameNewValidationError ? this.state.LinkNameNewValidationErrorMsg : ""}
                    FormHelperTextProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                    name='LinkNameNew'

                  />
                  <Typography id="modal-modal-title" variant="subtitle1" color='GrayText' fontStyle='inherit' component="h6">קישור:</Typography>
                  <TextField
                    id=""
                    value={this.state.LinkNew}
                    onChange={this.onChange}
                    type='text'
                    fullWidth
                    required
                    error={this.state.LinkNewValidationError}
                    helperText={this.state.LinkNewValidationError ? 'נא למלא את כל שדות החובה' : ""}
                    FormHelperTextProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
                    name='LinkNew'
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Button variant="text" color="primary" onClick={() => { this.HandleToNewLinks() }}>
                      אישור
                    </Button>
                  </div>
                </div>
              </Box>
            </Modal>
            <span style={{ fontSize: '25px', fontWeight: 'bold', marginRight: '0.5rem' }}>הקישורים שלי</span>
            <Button style={{ marginRight: '1rem', backgroundColor: 'white' }} size='small' className={styles.AddBtn} onClick={() => this.handleOpen()} variant='outlined' startIcon={<AddIcon style={{ paddingLeft: '0.5em' }} />}>הוספת קישור</Button>
            <div className={styles.linksContainer} >

              {this.state.MyLinks?.length > 0 ? this.state.MyLinks.map((item: any, index: number) => (
                <>
                  <div key={uuidv4()} className={styles.ListItem}>
                    <div onClick={() => window.location.href = item?.Title} className={styles.listItemChildDiv}>

                      <LinkIcon htmlColor='#1976db' />
                      <Tooltip title={item?.LinkName}>
                        <span className={styles.Link} style={{ fontWeight: 'bold' }}>{item?.LinkName}</span>
                      </Tooltip>
                    </div>

                    {/* {item.LinkName !== 'כלי צמ"ה' && item?.Flag ? <ClearIcon fontSize='small' onClick={(e) => { e.stopPropagation(), this.removeItem(item) }} /> : null} */}
                  </div>
                </>
              )) : <span style={{ fontWeight: 'bold' }}>לא נבחרו קישורים להצגה</span>}
            </div>
          </section>}
      </div>
    );
  }
}
