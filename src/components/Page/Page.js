import React, { useState, useEffect } from "react";
import "./Page.scss";
import Spinner from "../Spinner/Spinner";
import { FormattedMessage } from "react-intl";
import QData from "../../services/QData";
import { withAppContext } from "../../context/AppProvider";

function Page({ number, appContext }) {
	let imageName = NumToString(number + 1);
	const [isLoaded, updateLoaded] = useState(false);
	//const [isNarrow, updateIsNarrow] = useState(true);

	const showImage = e => {
		updateLoaded(true);
	};

	//Run upon mounted, props changes
	useEffect(() => {
		//console.log("Page changed to " + props.number);
		updateLoaded(false);
	}, [number]);

	const suraIndex = QData.pageSura(number + 1);

	return (
		<div className="Page">
			<div
				className="PageHeader"
				style={{ paddingLeft: appContext.isNarrow ? "50px" : "0" }}
			>
				<div className="SuraTitle">
					<FormattedMessage id="sura" />
					:&nbsp;<span>{suraIndex + 1}</span>&nbsp;-&nbsp;
					<FormattedMessage id="sura_names">
						{sura_names => {
							return sura_names[suraIndex];
						}}
					</FormattedMessage>
				</div>
				<div className="PartTitle">
					<FormattedMessage id="part" />
					:&nbsp;<span>{QData.pagePart(number + 1)}</span>
				</div>
			</div>
			<Spinner visible={!isLoaded} />
			<div
				className="PageFrame"
				style={{ padding: appContext.isNarrow ? "0" : "0 20px" }}
			>
				<img
					style={{ visibility: isLoaded ? "visible" : "hidden" }}
					onLoad={showImage}
					src={"http://www.egylist.com/qpages_800/page" + imageName + ".png"}
					alt={"Page #" + number + 1}
				/>
			</div>
			<div className="PageFooter">{number + 1}</div>
		</div>
	);
}

function NumToString(number, padding = 3) {
	let padded = number.toString();
	while (padded.length < padding) {
		padded = "0" + padded;
	}
	return padded;
}

export default withAppContext(Page);
