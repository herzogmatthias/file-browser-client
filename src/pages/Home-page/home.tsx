import React, { Component } from "react";
import NavbarComponent from "../../components/navBar-component/navbar-component";
import { IHomeState } from "./IHomeState";
import { PathService } from "../../utils/path-service";
import DownloadSnackbar from "../../components/download-snackbar/download-snackbar";
import {
  Grid,
  withStyles,
  CircularProgress,
  Typography,
  Snackbar,
  SnackbarContent
} from "@material-ui/core";
import FileComponent from "../../components/file-component/file-component";
import SecondNavigation from "../../components/second-navigation/second-navigation";
import SnackbarComponent from "../../components/snackBar-component/snackbarComponent";
import { IFile } from "../../models/file";
import { styles, IHomeProps } from "./IHomeProps";
import { withRouter } from "react-router";
import Slide from "@material-ui/core/Slide";
import SidebarComponent from "../../components/sidebar-component/sidebar-component";
import { TransitionProps } from "@material-ui/core/transitions/transition";
import {
  FOLDER_HEADER,
  FILE_HEADER,
  SECOND_NAV_INITPATH
} from "../../static/static-strings";

class Home extends Component<IHomeProps, IHomeState> {
  constructor(props: IHomeProps) {
    super(props);

    this.state = {
      draggedOverFileId: "",
      internalFileMovement: "",
      uploadFile: false,
      files: { key: "", path: "", name: "", atime: "", mtime: "", type: "" },
      open: false,
      isLoading: true,
      message: "",
      type: "error",
      backButton: false,
      downloads: [],
      downloadOpen: false,
      selectedFile: {
        key: "",
        path: "",
        name: "",
        atime: "",
        mtime: "",
        type: ""
      },
      showFile: { key: "", path: "", name: "", atime: "", mtime: "", type: "" },
      handleClose: () => this.handleClose()
    };
  }
  async componentDidMount() {
    const path = window.location.pathname;
    if (path !== localStorage.getItem("initPath")) {
      this.setState({ backButton: true });
    }
    const x = await this.reInitDirectory({
      success: true,
      err: "",
      path: path
    });
    if (this.state.showFile.path)
      window.history.pushState(
        this.state.showFile,
        "",
        this.state.showFile.path
      );
    window.onpopstate = (e: any) => {
      this.setState({ showFile: e.state as IFile });
    };
  }
  downloadStarted = (key: string, state: string, progress: number) => {
    this.setState({
      downloads: [...this.state.downloads, { key, state, progress }],
      downloadOpen: true
    });
  };
  onSecondNavClicked = async (pathName: string, pathArray: string[]) => {
    const pathIndex = pathArray.findIndex(p => p === pathName);
    const path =
      pathName === "Start"
        ? localStorage.getItem("initPath")
        : localStorage.getItem("initPath") +
          "/" +
          pathArray.splice(1, pathIndex).join("/");
    if (path !== localStorage.getItem("initPath")) {
      this.setState({ backButton: true });
    }
    const x = await this.reInitDirectory({
      success: true,
      err: "",
      path: path
    });
    if (this.state.showFile.path)
      window.history.pushState(
        this.state.showFile,
        "",
        this.state.showFile.path
      );
  };
  onDownloadProgress = (key: string, progress: number, state: string) => {
    const copyArray = this.state.downloads;
    const downloadToUpdate = copyArray.find(val => val.key === key);
    downloadToUpdate!.progress = progress;
    downloadToUpdate!.state = "downloading";
    this.setState({ downloads: copyArray });
  };
  handleClose = () => {
    this.setState({ open: !this.state.open });
  };
  finishedDownload = (key: string) => {
    const copyArray = this.state.downloads;
    copyArray.splice(
      copyArray.findIndex(val => val.key === key),
      1
    );
    this.setState({ downloads: copyArray });
    if (this.state.downloads.length === 0) {
      this.setState({ downloadOpen: false });
    }
  };
  handleClick = (file: IFile) => {
    this.setState({ selectedFile: file });
  };
  handleDoubleClick = (file: IFile) => {
    this.setState({ showFile: file, backButton: true });
    let lastSlash = file.path.lastIndexOf("/");
    let path = file.path.slice(lastSlash, file.path.length);
    window.history.pushState(file, "", window.location.href + path);
  };
  reInitDirectory = async (response: any) => {
    if (response.success) {
      const path = response.path;
      const fileObject: any = await PathService.getFiles(path);
      if (fileObject.success) {
        this.setState({ files: fileObject.directoryTree as IFile });
        this.setState({ selectedFile: this.state.files });
        this.setState({ showFile: this.state.files });
      } else {
        this.setState({ open: true, message: fileObject.err });
      }
      this.setState({ isLoading: false });
    } else {
      this.setState({ open: true, message: response.err });
    }
  };
  newFolderAdded = (response: any) => {
    this.reInitDirectory(response);
  };
  changeName = async (newName: string, path: string) => {
    const newPath = path.substr(0, path.lastIndexOf("/")) + "/" + newName;
    const response: any = await PathService.editName(
      newPath,
      localStorage.getItem("initPath") as string,
      path
    );
    if (response.success) {
      this.reInitDirectory({
        success: response.success,
        err: response.err,
        path: path
      });
    }
  };
  _onDragStart = (ev: React.DragEvent<HTMLDivElement>) => {
    this.setState({ internalFileMovement: ev.currentTarget.id });
  };
  _onDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    this.setState({ draggedOverFileId: "", internalFileMovement: "" });
  };
  _uploadZone = (ev: React.DragEvent<HTMLDivElement>) => {
    if (this.state.internalFileMovement === "") {
      ev.preventDefault();
      this.setState({ uploadFile: true });
    }
  };
  _onDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    if (
      this.state.draggedOverFileId !== ev.currentTarget.id &&
      this.state.internalFileMovement !== ""
    ) {
      this.setState({ draggedOverFileId: ev.currentTarget.id });
    }
  };
  _endDrag = (ev: React.DragEvent<HTMLDivElement>) => {
    this.setState({ draggedOverFileId: "", internalFileMovement: "" });
  };
  _uploadFile = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    if (this.state.internalFileMovement === "") {
      this.setState({ uploadFile: false });
      console.log(ev.dataTransfer.files);
    }
  };
  _slideTransition = (props: TransitionProps) => {
    return <Slide {...props} direction="up" />;
  };
  backButtonClicked = async () => {
    this.setState({ isLoading: true });
    let lastSlash = this.state.showFile.path.lastIndexOf("/");
    let path = this.state.showFile.path.slice(0, lastSlash);
    const res: any = await PathService.getFiles(path);
    if (res.directoryTree != null) {
      this.setState({ showFile: res.directoryTree as IFile, isLoading: false });
      if (res.directoryTree.path === this.state.files.path) {
        this.setState({ backButton: false });
      }
    }
    window.history.back();
  };
  render() {
    const { classes } = this.props;
    return (
      <div>
        <header>
          <NavbarComponent
            newFolderAdded={this.newFolderAdded}
            selectedPath={this.state.showFile.path}
            backButtonClicked={this.backButtonClicked}
            backButton={this.state.backButton}
          />
          <SecondNavigation
            path={this.state.showFile.path
              .replace(localStorage.getItem("initPath")!, SECOND_NAV_INITPATH)
              .split("/")}
            onSecondNavClicked={this.onSecondNavClicked}
          />
        </header>
        {this.state.uploadFile ? (
          <Snackbar
            open={this.state.uploadFile}
            TransitionComponent={this._slideTransition}
            ContentProps={{
              "aria-describedby": "message-id"
            }}
          >
            <SnackbarContent
              className={classes.uploadNotification}
              message={<span id="message-id">Dateien hier ablegen</span>}
            ></SnackbarContent>
          </Snackbar>
        ) : null}
        <main
          className={classes.spacing}
          onDrop={this._uploadFile}
          onDragLeave={(e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            let rect = e.currentTarget.getBoundingClientRect();
            if (
              e.clientY < rect.top ||
              e.clientY >= rect.bottom ||
              e.clientX < rect.left ||
              e.clientX >= rect.right
            ) {
              this.setState({ uploadFile: false });
            }
          }}
          onDragOver={e => e.preventDefault()}
          onDragEnter={this._uploadZone}
          style={{
            opacity: this.state.uploadFile ? 0.6 : "unset",
            border: this.state.uploadFile ? "4px solid #039BE5" : "none"
          }}
        >
          {!this.state.isLoading ? (
            <div
              style={{ pointerEvents: this.state.uploadFile ? "none" : "auto" }}
            >
              <Typography variant="h3">{FOLDER_HEADER}</Typography>

              <Grid
                container
                spacing={3}
                classes={{
                  "spacing-xs-3": classes.spacingxs
                }}
              >
                {this.state.showFile.children!.map((val, index) => {
                  return val.type != undefined ? (
                    <Grid key={`${index} Grid`} item lg={2} md={3} xs={4}>
                      <div
                        id={val.key}
                        key={`${index} dragable`}
                        onDrop={this._onDrop}
                        onDragOver={this._onDragOver}
                        draggable
                        onDragStart={this._onDragStart}
                        onDragEnd={this._endDrag}
                      >
                        <FileComponent
                          key={`${val.path} ${index} File`}
                          currentDraggedOverFileId={
                            this.state.draggedOverFileId
                          }
                          changeName={this.changeName}
                          handleDoubleClick={this.handleDoubleClick}
                          downloadFinished={this.finishedDownload}
                          downloadStarted={this.downloadStarted}
                          onProgress={this.onDownloadProgress}
                          handleClick={this.handleClick}
                          backgroundColor={
                            val.name === this.state.selectedFile.name
                              ? "#039BE5"
                              : "transparent"
                          }
                          file={val}
                        />
                      </div>
                    </Grid>
                  ) : null;
                })}
              </Grid>
              <Typography variant="h3" style={{ marginTop: "2em" }}>
                {FILE_HEADER}
              </Typography>
              <Grid
                container
                spacing={3}
                classes={{
                  "spacing-xs-3": classes.spacingxs
                }}
              >
                {this.state.showFile.children!.map((val, index) => {
                  return val.type != "directory" ? (
                    <Grid key={`${index} Grid`} item lg={2} md={3} xs={4}>
                      <div
                        draggable
                        onDragStart={this._onDragStart}
                        onDragEnd={this._endDrag}
                        id={val.key}
                        key={`${index} dragable`}
                      >
                        <FileComponent
                          currentDraggedOverFileId={
                            this.state.draggedOverFileId
                          }
                          key={`${val.path} ${index} File`}
                          changeName={this.changeName}
                          downloadFinished={this.finishedDownload}
                          downloadStarted={this.downloadStarted}
                          onProgress={this.onDownloadProgress}
                          handleDoubleClick={this.handleDoubleClick}
                          handleClick={this.handleClick}
                          backgroundColor={
                            val.name === this.state.selectedFile.name
                              ? "#039BE5"
                              : "transparent"
                          }
                          file={val}
                        />
                      </div>
                    </Grid>
                  ) : null;
                })}
              </Grid>
            </div>
          ) : (
            <CircularProgress
              style={{ margin: "auto" }}
              className={classes.progress}
            />
          )}
          <SnackbarComponent
            handleClose={this.state.handleClose}
            message={this.state.message}
            type={this.state.type}
            open={this.state.open}
          />
          <DownloadSnackbar
            downloads={this.state.downloads}
            open={this.state.downloadOpen}
          />
        </main>

        <SidebarComponent
          selectedFile={this.state.selectedFile}
        ></SidebarComponent>
      </div>
    );
  }
}

export default withRouter(withStyles(styles)(Home));
