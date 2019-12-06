import React, { useState, useEffect, useRef, useContext } from "react";
import Modal from "./Modal";
import QData from "../../services/QData";
import { FormattedMessage as String } from "react-intl";
import { AppConsumer, AppContext } from "./../../context/App";
import Utils from "./../../services/utils";
import AKeyboard from "../AKeyboard/AKeyboard";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { ThemeContext } from "../../context/Theme";

const Search = ({}) => {
    const app = useContext(AppContext);
    const theme = useContext(ThemeContext);
    const input = useRef(null);
    const [searchTerm, setSearchTerm] = useState(
        localStorage.getItem("LastSearch") || ""
    );
    const [searchHistory, setSearchHistory] = useState(
        JSON.parse(localStorage.getItem("SearchHistory") || "[]")
    );
    const [results, setResults] = useState([]);
    const [pages, setPages] = useState(1);
    const [keyboard, setkeyboard] = useState(false);

    let resultsDiv;

    const showKeyboard = e => {
        setkeyboard(true);
    };
    const hideKeyboard = e => {
        setkeyboard(false);
    };

    useEffect(() => {
        let textInput = input.current;
        setTimeout(function() {
            textInput.focus();
            // textInput.select();
        }, 100);
        doSearch(searchTerm);
        // textInput.addEventListener("blur", hideKeyboard);
        textInput.addEventListener("focus", showKeyboard);
        return () => {
            // textInput.removeEventListener("blur", hideKeyboard);
            textInput.removeEventListener("focus", showKeyboard);
        };
    }, []);

    const addToSearchHistory = () => {
        let history = [
            searchTerm,
            ...searchHistory.filter(s => s !== searchTerm)
        ];
        history = history.slice(0, 10); //keep last 10 items
        localStorage.setItem("SearchHistory", JSON.stringify(history));
        setSearchHistory(history);
    };

    //TODO: duplicate code with QIndex
    const gotoSura = ({ target }) => {
        app.hideMask();
        setkeyboard(false);
        let index = parseInt(target.getAttribute("sura"));
        app.gotoSura(index);
        if (!app.isCompact && app.pagesCount === 1) {
            app.closePopup();
        }
    };

    const gotoAya = e => {
        const aya = e.target.getAttribute("aya");
        if (!app.isCompact && app.pagesCount === 1) {
            app.closePopup();
        }
        setkeyboard(false);
        app.gotoAya(parseInt(aya), { sel: true });
        addToSearchHistory();
        e.preventDefault();
    };

    const renderMore = () => {
        if (results.length > pages * 20) {
            return (
                <button
                    className="MoreResults"
                    onClick={e => setPages(pages + 1)}
                >
                    <String id="more" />
                    ...
                </button>
            );
        }
    };

    // const onResultKeyDown = e => {
    // 	if (e.key === "Enter") {
    // 		gotoAya(e);
    // 	}
    // };

    const nSearchTerm = Utils.normalizeText(searchTerm);
    const renderSuras = () => {
        if (nSearchTerm.length < 1) {
            return null;
        }
        return (
            <ul
                id="MatchedSuraNames"
                className="SpreadSheet"
                style={{
                    columnCount: Math.floor((app.popupWidth() - 50) / 120) //-50px margin
                }}
            >
                <String id="sura_names">
                    {sura_names => {
                        const nSuraNames = Utils.normalizeText(
                            sura_names
                        ).split(",");
                        return sura_names
                            .split(",")
                            .map((suraName, index) => {
                                return { name: suraName, index: index };
                            })
                            .filter(
                                suraInfo =>
                                    nSuraNames[suraInfo.index].match(
                                        new RegExp(nSearchTerm, "i")
                                    ) !== null
                                // nSuraNames[suraInfo.index].indexOf(
                                //     nSearchTerm
                                // ) !== -1
                            )
                            .map(suraInfo => {
                                return (
                                    <li key={suraInfo.index}>
                                        <button
                                            onClick={gotoSura}
                                            sura={suraInfo.index}
                                        >
                                            {suraInfo.index +
                                                1 +
                                                ". " +
                                                suraInfo.name}
                                        </button>
                                    </li>
                                );
                            });
                    }}
                </String>
            </ul>
        );
    };

    const renderResults = () => {
        // if (!results.length) {
        // 	return;
        // }
        let page = results.slice(0, pages * 20);
        return (
            <ol
                className="ResultsList"
                onMouseDown={hideKeyboard}
                style={
                    {
                        // maxHeight:
                        // app.pageHeight() - 175 - (app.playerVisible ? 60 : 0)
                    }
                }
                ref={ref => {
                    resultsDiv = ref;
                }}
            >
                {page.map(
                    ({ aya, text: ayaText, ntext: normalizedAyaText }, i) => {
                        const ayaInfo = QData.ayaIdInfo(aya);
                        return (
                            <li
                                key={aya}
                                onClick={gotoAya}
                                aya={aya}
                                className="ResultItem"
                                tabIndex="0"
                            >
                                <span className="ResultInfo">
                                    {app.suraName(ayaInfo.sura)}
                                </span>
                                <span
                                    className="ResultText link"
                                    dangerouslySetInnerHTML={Utils.hilightSearch(
                                        nSearchTerm,
                                        ayaText,
                                        normalizedAyaText
                                    )}
                                />
                            </li>
                        );
                    }
                )}
                {renderMore()}
            </ol>
        );
    };

    useEffect(() => {
        doSearch(searchTerm);
    }, [searchTerm]);

    const onHistoryButtonClick = e => {
        const searchTerm = e.target.textContent;
        setkeyboard(false);
        setSearchTerm(searchTerm);
        doSearch(searchTerm);
    };

    const doSearch = searchTerm => {
        let sResults = [];
        let normSearchTerm = Utils.normalizeText(searchTerm);

        if (normSearchTerm.length > 0) {
            localStorage.setItem("LastSearch", searchTerm);
        }

        const verseList = app.verseList();
        if (verseList.length > 0 && normSearchTerm.length > 2) {
            sResults = app.normVerseList().reduce((results, ntext, aya) => {
                if (ntext.includes(normSearchTerm)) {
                    results.push({ aya, text: verseList[aya], ntext: ntext });
                }
                return results;
            }, []);
        }
        setResults(sResults);
    };

    const onSubmitSearch = txt => {
        let firstResult = resultsDiv.querySelector("li");
        if (firstResult) {
            firstResult.focus();
            addToSearchHistory();
        }
        setkeyboard(false);
        // e.preventDefault();
    };

    const renderKeyboard = () => {
        if (keyboard) {
            return (
                <div
                    className="KeyboardFrame"
                    onTouchStart={e => {
                        e.stopPropagation();
                    }}
                    onMouseDown={e => {
                        e.stopPropagation();
                    }}
                >
                    <AKeyboard
                        initText={searchTerm}
                        onUpdateText={setSearchTerm}
                        onCancel={hideKeyboard}
                        onEnter={onSubmitSearch}
                    />
                </div>
            );
        }
    };

    const renderCursor = () => {
        return <span className="TypingCursor"></span>;
    };

    const clearSearch = e => {
        setSearchTerm("");
        e.stopPropagation();
    };

    const renderTypedText = () => {
        if (!searchTerm) {
            return <String id="search_prompt" />;
        }
        return (
            <>
                {searchTerm}
                {renderCursor()}
                <div className="ClearButton" onClick={clearSearch}>
                    <Icon icon={faTimes} />
                </div>
            </>
        );
    };

    const formHeight = 130,
        resultsInfoHeight = 20;

    return (
        <>
            <div className="Title">
                <div
                    ref={input}
                    className={
                        "TypingConsole" + (!searchTerm.length ? " empty" : "")
                    }
                    tabIndex="0"
                    onClick={showKeyboard}
                >
                    {renderTypedText()}
                </div>
                <div className="ButtonsBar">
                    <button onClick={onSubmitSearch}>
                        <Icon icon={faSearch} />
                    </button>
                </div>
            </div>
            <div id="SearchHistory">
                {searchHistory.map((s, i) => {
                    return (
                        <button key={i} onClick={onHistoryButtonClick}>
                            {s}
                        </button>
                    );
                })}
            </div>
            <div className="ResultsInfo" style={{ height: resultsInfoHeight }}>
                <String className="SuraTitle" id="results_for">
                    {resultsFor => {
                        if (searchTerm.length) {
                            return (
                                <>
                                    {results.length +
                                        " " +
                                        resultsFor +
                                        " " +
                                        searchTerm}
                                </>
                            );
                        }
                        return null;
                    }}
                </String>
            </div>
            <div
                className="PopupBody"
                onTouchStart={hideKeyboard}
                onMouseDown={hideKeyboard}
                style={{
                    height: app.appHeight - formHeight - 26 // footer + padding + formMargins
                }}
            >
                {renderSuras()}
                {renderResults()}
                {renderKeyboard()}
            </div>
        </>
    );
};

export default Search;
