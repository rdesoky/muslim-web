import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import QData from "../../services/QData";
import { FormattedMessage } from "react-intl";
import { AppConsumer } from "../../context/App";

const QIndex = ({ app }) => {
	const getSuraNames = () => {
		let suraNames = [];
		for (let i = 1; i <= 114; i++) {
			suraNames.push("Sura " + i);
		}
		return suraNames;
	};

	const gotoSura = ({ target }) => {
		app.hideMask();
		let index = parseInt(target.getAttribute("sura"));
		app.gotoSura(index);
		app.closePopup();
	};

	let tableRoot;

	useEffect(() => {
		let pageIndex = app.getCurrentPageIndex();
		let sura = QData.pageSura(pageIndex + 1);
		const currSuraBtn = tableRoot.querySelector(`button[sura='${sura}']`);
		if (currSuraBtn) {
			currSuraBtn.focus();
		}
	}, []);

	const { appWidth, pagesCount } = app;
	return (
		<>
			<div className="Title">
				<FormattedMessage id="index" />
			</div>
			<ul
				className="SpreadSheet"
				style={{
					columnCount: Math.floor(appWidth / pagesCount / 120)
				}}
				ref={ref => {
					tableRoot = ref;
				}}
			>
				{getSuraNames().map((name, index) => {
					return (
						<li key={index}>
							<button sura={index} onClick={gotoSura}>
								<FormattedMessage id={"sura_names"}>
									{data => {
										return index + 1 + ". " + data.split(",")[index];
									}}
								</FormattedMessage>
							</button>
						</li>
					);
				})}
			</ul>
		</>
	);
};

export default AppConsumer(QIndex);
