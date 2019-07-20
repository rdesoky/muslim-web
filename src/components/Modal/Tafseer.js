import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import Utils from "../../services/utils";
import QData from "../../services/QData";
import { FormattedMessage } from "react-intl";
import { withAppContext } from "../../context/App";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";

const TafseerList = [
	{ id: "muyassar", name: "الميسر", dir: "rtl", file: "ar.muyassar.txt" },
	{ id: "yusufali", name: "English", dir: "ltr", file: "en.yusufali.txt" }
];

const Tafseer = ({ onClose, isOpen, appContext }) => {
	const [tafseer, setTafseer] = useState(
		localStorage.getItem("tafseer") || "muyassar"
	);
	const [tafseerData, setTafseerData] = useState([]);

	const handleKeyDown = e => {
		switch (e.code) {
			case "ArrowDown":
			case "ArrowLeft":
				offsetSelection(1);
				break;
			case "ArrowUp":
			case "ArrowRight":
				offsetSelection(-1);
				break;
			default:
				return;
		}
	};

	const offsetSelection = offset => {
		const ayaId = appContext.offsetSelection(offset);
		appContext.gotoAya(ayaId);
	};

	useEffect(() => {
		let fileName = TafseerList.find(i => i.id === tafseer).file;
		fetch(`${process.env.PUBLIC_URL}/${fileName}`)
			.then(r => r.text())
			.then(txt => {
				setTafseerData(txt.split("\n"));
			});
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [tafseer]);

	const renderVerse = () => {
		const verseList = appContext.verseList();
		if (verseList.length > appContext.selectStart) {
			return verseList[appContext.selectStart];
		}
	};
	const renderTafseer = () => {
		if (tafseerData.length > appContext.selectStart) {
			return tafseerData[appContext.selectStart];
		}
		return "Loading...";
	};

	const onSelectTafseer = e => {
		const { target: option } = e;
		const tafseer = option.value;
		localStorage.setItem("tafseer", option.value);
		setTafseer(tafseer);
	};

	const renderSelector = () => {
		return (
			<select onChange={onSelectTafseer}>
				{TafseerList.map(taf => {
					return (
						<option value={taf.id} selected={taf.id === tafseer}>
							{taf.name}
						</option>
					);
				})}
			</select>
		);
	};

	const tafDirection = () => {
		return TafseerList.find(i => i.id === tafseer).dir;
	};

	const ayaInfo = QData.ayaIdInfo(appContext.selectStart);

	return (
		<Modal open={isOpen} onClose={onClose}>
			<div className="Title">
				<button onClick={e => offsetSelection(-1)}>
					<FontAwesomeIcon icon={faAngleRight} />
				</button>
				<FormattedMessage id="sura_names">
					{sura_names => (
						<span className="FlexTitle">
							{sura_names.split(",")[ayaInfo.sura] + ` - ${ayaInfo.aya + 1}`}
						</span>
					)}
				</FormattedMessage>
				<button onClick={e => offsetSelection(1)}>
					<FontAwesomeIcon icon={faAngleLeft} />
				</button>
			</div>

			<div>
				<p className="TafseerVerse">{renderVerse()}</p>
			</div>
			<div>
				<p className="TafseerText" style={{ direction: tafDirection() }}>
					{renderSelector()}
					{" - "}
					{renderTafseer()}
				</p>
			</div>
		</Modal>
	);
};

export default withAppContext(Tafseer);
