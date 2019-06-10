import React from "react";
import "./Sidebar.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faSearch,
	faPaperPlane,
	faPlayCircle,
	faBookmark
} from "@fortawesome/free-solid-svg-icons";

function Sidebar(props) {
	const onClick = id => {
		if (props.onCommand) {
			props.onCommand(id);
		}
	};

	return (
		<div className="Sidebar">
			<div onClick={e => onClick("Search")}>
				<FontAwesomeIcon icon={faSearch} />
			</div>
			<div onClick={e => onClick("Goto")}>
				<FontAwesomeIcon icon={faPaperPlane} />
			</div>
			<div onClick={e => onClick("Play")}>
				<FontAwesomeIcon icon={faPlayCircle} />
			</div>
			<div onClick={e => onClick("Bookmark")}>
				<FontAwesomeIcon icon={faBookmark} />
			</div>
		</div>
	);
}

export default Sidebar;
