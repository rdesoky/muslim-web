import React from "react";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { AppConsumer } from "../../context/App";
import Transition from "./../../services/Transition";
import "./Modal.scss";
import { useSelector } from "react-redux";
import {
  selectActiveSide,
  selectAppWidth,
  selectIsCompact,
  selectIsNarrow,
  selectIsWide,
  selectModalPopup,
  selectPagerWidth,
  selectPagesCount,
} from "../../store/layoutSlice";
import { useLocation } from "react-router-dom";
import { getCurrentPageNumber } from "../../services/utils";
import { selectSidebarWidth } from "../../store/uiSlice";

const Modal = ({ onClose, children, app, show, name, modeless }) => {
  const pagerWidth = useSelector(selectPagerWidth);
  const location = useLocation();
  const activeSide = useSelector(
    selectActiveSide(getCurrentPageNumber(location))
  );
  const isCompact = useSelector(selectIsCompact);
  const isWide = useSelector(selectIsWide);
  const appWidth = useSelector(selectAppWidth);
  const pagesCount = useSelector(selectPagesCount);
  const isNarrow = useSelector(selectIsNarrow);
  const sidebarWidth = useSelector(selectSidebarWidth);
  const modalPopup = useSelector(selectModalPopup);

  const onClickClose = (e) => {
    if (typeof onClose === "function") {
      onClose(e);
    }
    e.preventDefault();
  };

  const preventClose = (e) => {
    e.stopPropagation();
  };

  // let activeSide = app.getActiveSide();

  // useEffect(() => {
  //     // //select the launching command from in the side bar
  //     // const commandBtn = document.querySelector(
  //     //     `#RecentCommands button[command=${app.popup}]`
  //     // );
  //     // if (commandBtn) {
  //     //     commandBtn.focus();
  //     // }
  //     return () => {
  //         //Upon exit, select the most recent command to avoid hidden focus
  //         Utils.selectTopCommand();
  //     };
  // }, []);

  // const {isCompact, isWide, appWidth, pagesCount} = app;

  const calcLeft = () => {
    return isWide || isCompact ? 0 : activeSide === 0 ? 0 : "50%";
  };

  const calcRight = () => {
    if (isWide || isCompact) {
      return pagerWidth;
    }
    if (pagesCount === 2 && activeSide === 0) {
      return appWidth - pagerWidth / 2 - sidebarWidth;
    }
    return 0;
  };

  // const isBlockMouse = () => {
  //     // return modeless === true || isWide || isCompact || show === false;
  //     return pagesCount === 1 && !isCompact;
  // };

  return (
    <Transition>
      <div
        id={`${name}Popup`}
        className={"ModalOverlay".appendWord("modal", modalPopup)}
        style={{
          left: isNarrow ? 0 : 51,
          zIndex: isNarrow ? 3 : 1,
          // pointerEvents: isBlockMouse() ? "fill" : "none"
        }}
        // onClick={onClickClose}
      >
        <div
          style={{
            left: calcLeft(),
            right: calcRight(),
            //,zoom: app.appHeight > 600 ? 1 : app.appHeight / 600
          }}
          className={"ModalContent" + (show === false ? " HiddenPopup" : "")}
          onClick={preventClose}
        >
          {children}
          <button
            className="CancelButton"
            onClick={onClickClose}
            // style={{ right: calcRight() }}
          >
            <Icon icon={faTimes} />
          </button>
        </div>
        {/* <button
                    className="CancelButton"
                    onClick={onClickClose}
                    style={{ right: calcRight() }}
                >
                    <Icon icon={faTimes} />
                </button> */}
      </div>
    </Transition>
  );
};

export default AppConsumer(Modal);
