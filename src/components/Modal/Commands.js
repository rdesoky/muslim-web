import React, { useContext } from "react";
import { analytics } from "./../../services/Analytics";
import { AppContext } from "../../context/App";
import { AudioState, PlayerContext } from "../../context/Player";
import { FormattedMessage as String, useIntl } from "react-intl";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faLightbulb,
  faUserCircle,
  faSearch,
  faPlayCircle,
  faHeart,
  faCog,
  faAdjust,
  faQuestion,
  faCopy,
  faShareAlt,
  faQuran,
  faExpand,
  faBookmark,
  faAngleDoubleDown,
  faAngleDoubleUp,
  faFileDownload,
  faStopCircle,
  faPauseCircle,
  faBars,
  faListAlt,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";

import {
  faLightbulb as farLightbulb,
  faBookmark as farBookmark,
  faKeyboard,
} from "@fortawesome/free-regular-svg-icons";

import {
  copy2Clipboard,
  requestFullScreen,
  selectTopCommand,
} from "../../services/utils";
import { PlayerButtons } from "../AudioPlayer/AudioPlayer";
import { VerseInfo } from "../Widgets";
import { UserImage } from "./User";
import { AddHifz } from "./Favorites";
import { verseLocation } from "./../../services/QData";
import {
  hideMenu,
  selectShowMenu,
  showMenu,
  showPopup,
  showToast,
  toggleMenu,
} from "../../store/uiSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectIsNarrow } from "../../store/layoutSlice";
import { setMessageBox } from "../MessageBox";

export const CommandIcons = {
  Commands: faBars,
  Index: faListAlt,
  Indices: faListAlt,
  Goto: faBookOpen,
  Search: faSearch,
  Play: faPlayCircle,
  AudioPlayer: faPlayCircle,
  Settings: faCog,
  Profile: faUserCircle,
  Theme: faAdjust,
  Favorites: faHeart,
  update_hifz: faHeart,
  Help: faQuestion,
  Mask: faLightbulb,
  MaskOn: farLightbulb,
  Copy: faCopy,
  Share: faShareAlt,
  Tafseer: faQuran,
  // Exercise: faPenNib,
  Exercise: faKeyboard,
  Fullscreen: faExpand,
  Bookmarks: faBookmark,
  ToggleButton: faAngleDoubleDown,
  Downloading: faFileDownload,
  Pause: faPauseCircle,
  Stop: faStopCircle,
};

const getIcon = (commandId, app, showMenu) => {
  switch (commandId) {
    case "Mask":
      return CommandIcons[app.maskStart === -1 ? "Mask" : "MaskOn"];
    case "ToggleButton":
      return showMenu ? faAngleDoubleUp : faAngleDoubleDown;
    case "Bookmarks":
    case "Bookmark":
      return app.isBookmarked() ? faBookmark : farBookmark;
    default:
      return CommandIcons[commandId];
  }
};

const CommandIcon = ({ command, app, player }) => {
  const showMenu = useSelector(selectShowMenu);
  switch (command) {
    case "Profile":
      return <UserImage />;
    case "AudioPlayer":
      return (
        // <div
        //     className={"ReciterIcon".appendWord(
        //         "blinking",
        //         player.audioState === AudioState.playing
        //     )}
        //     style={{
        //         backgroundImage:
        //             "url(" +
        //             process.env.PUBLIC_URL +
        //             "/images/" +
        //             player.reciter +
        //             ".jpg)"
        //     }}
        // />
        // <span>
        <img
          src={`${process.env.PUBLIC_URL}/images/${player.reciter}.jpg`}
          className={"ReciterIcon".appendWord(
            "blinking",
            player.audioState === AudioState.playing
          )}
          alt="recite"
        />
        // </span>
      );

    default:
      return (
        <span>
          <Icon icon={getIcon(command, app, showMenu)} />
        </span>
      );
  }
};

const Commands = () => {
  // const app = useContext(AppContext);
  const isNarrow = useSelector(selectIsNarrow);
  const dispatch = useDispatch();

  const list = [
    "Index",
    "AudioPlayer",
    "Search",
    "Exercise",
    "Tafseer",
    "Mask",
    "Goto",
    "Theme",
    "Bookmarks",
    "Copy",
    "Share",
    "update_hifz",
    "Profile",
    "Settings",
    "Help",
    // "Fullscreen",
  ];

  return (
    <>
      <div className="Title">
        {isNarrow ? (
          <>
            <VerseInfo trigger="commands_title" />
            <PlayerButtons trigger="commands_title" showReciter={false} />
          </>
        ) : (
          <String id="commands" />
        )}
      </div>
      <div className="CommandsList">
        {list.map((command) => (
          <CommandButton key={command} command={command} showLabel={true} />
        ))}
      </div>
    </>
  );
};

const CommandButton = ({
  id,
  command,
  showLabel,
  style,
  className,
  trigger,
}) => {
  const app = useContext(AppContext);
  const player = useContext(PlayerContext);
  const dispatch = useDispatch();
  const menuExpanded = useSelector(selectShowMenu);
  const intl = useIntl();

  const runCommand = (command) => {
    // app.setExpandedMenu(false);
    selectTopCommand();
    switch (command) {
      case "Commands":
        // app.setExpandedMenu(!app.expandedMenu);
        dispatch(toggleMenu());
        return;
      case "Play":
        //TODO: first navigate to the current selection
        analytics.logEvent("play_audio", {
          ...verseLocation(app.selectStart),
          reciter: player.reciter,
          trigger,
        });
        app.gotoAya(app.selectStart);
        player.play();
        return;
      case "Pause":
        analytics.logEvent("pause_audio", {
          ...verseLocation(player.playingAya),
          reciter: player.reciter,
          trigger,
        });
        if (player.audioState === AudioState.playing) {
          player.pause();
        } else {
          player.resume();
        }
        return;
      case "Stop":
        analytics.logEvent("stop_audio", {
          ...verseLocation(player.playingAya),
          reciter: player.reciter,
          trigger,
        });
        player.stop(true);
        return;
      case "Downloading":
        analytics.logEvent("retry_stuck_audio", {
          ...verseLocation(player.playingAya),
          reciter: player.reciter,
        });
        player.stop();
        setTimeout(() => {
          player.play();
        }, 500);
        return;
      case "ToggleButton":
        analytics.logEvent(
          menuExpanded ? "collapse_menu" : "expand_menu",
          trigger
        );
        // app.toggleShowMenu();
        dispatch(toggleMenu());
        return;
      case "Mask":
        analytics.logEvent(app.maskStart === -1 ? "show_mask" : "hide_mask", {
          ...verseLocation(app.selectStart),
          trigger,
        });
        app.setMaskStart();
        break;
      case "Copy":
        analytics.logEvent("copy_text", {
          ...verseLocation(app.selectStart),
          verses_count: app.selectEnd - app.selectStart + 1,
          trigger,
        });
        copy2Clipboard(app.getSelectedText());
        dispatch(showToast("text_copied"));
        // app.showToast(app.intl.formatMessage({ id: "text_copied" }));
        break;
      case "Share":
        break;
      case "Fullscreen":
        requestFullScreen();
        break;
      case "Bookmark":
        analytics.logEvent("bookmark", {
          ...verseLocation(app.selectStart),
          trigger,
        });
        switch (app.toggleBookmark()) {
          case 1:
            dispatch(showToast("bookmark_added"));
            break;
          case -1:
            dispatch(showToast("bookmark_deleted"));
            break;
        }
        return;
      case "Favorites":
      case "update_hifz":
        analytics.logEvent("show_update_hifz", {
          ...verseLocation(app.selectStart),
          trigger,
        });
        setMessageBox({
          title: <String id="update_hifz" />,
          content: <AddHifz />,
        });
        break;
      // case "Bookmarks":
      //     if (app.popup === "Exercise") {
      //         app.toggleBookmark();
      //         break;
      //     }
      default: //already calls pushRecentCommand()
        analytics.logEvent(`show_${command.toLowerCase()}`, {
          trigger,
        });
        dispatch(showPopup(command));
        // app.setPopup(command);
        dispatch(hideMenu());
        return;
    }
    app.pushRecentCommand(command);
    // if (pagesCount == 1) {
    //     app.closePopup();
    // }
    // app.setShowMenu(false);
    dispatch(hideMenu());
  };

  const renderLabel = () => {
    if (showLabel === true) {
      let label = (
        <String className="CommandLabel" id={command.toLowerCase()} />
      );
      switch (command) {
        case "Profile":
          if (app.user && !app.user.isAnonymous) {
            label = app.user.email;
          }
          break;
        default:
          break;
      }
      return <span className="CommandLabel">{label}</span>;
    }
  };

  const isDisabled = (command) => {
    return false;
    // return (
    //     app.popup === "Exercise" &&
    //     ![
    //         "Commands",
    //         "Play",
    //         "Pause",
    //         "Exercise",
    //         "Stop",
    //         "Bookmarks",
    //         "Copy"
    //     ].includes(command)
    // );
  };

  return (
    <button
      id={id}
      onClick={(e) => {
        runCommand(command);
        switch (command) {
          case "Commands":
            e.stopPropagation();
            break;
          default:
            break;
        }
      }}
      style={style}
      disabled={isDisabled(command)}
      className={"CommandButton".appendWord(className)}
      title={showLabel ? "" : intl.formatMessage({ id: command.toLowerCase() })}
    >
      <CommandIcon {...{ command, app, player }} />
      {renderLabel()}
    </button>
  );
};
export default Commands;
export { CommandIcon, CommandButton };
