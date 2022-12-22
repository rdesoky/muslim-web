import {
    faPlayCircle,
    faRandom,
    faThumbsDown,
    faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { FormattedMessage as String } from "react-intl";
import AKeyboard from "../AKeyboard/AKeyboard";
import { ActivityChart } from "../Hifz";
import { AppContext } from "./../../context/App";
import { AudioRepeat, AudioState } from "./../../context/Player";
import { normalizeText } from "./../../services/utils";
import { VerseInfo, VerseText } from "./../Widgets";
import { TafseerView } from "./Tafseer";

import { faKeyboard } from "@fortawesome/free-regular-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { quranNormalizedText, quranText } from "../../App";
import { analytics } from "../../services/Analytics";
import { ayaIdInfo, getPageIndex, verseLocation } from "../../services/QData";
import {
    selectAppHeight,
    selectIsCompact,
    selectIsNarrow,
    selectIsWide,
    selectPagesCount,
    setModalPopup,
} from "../../store/layoutSlice";
import {
    gotoAya,
    hideMask,
    selectStartSelection,
    setMaskStart,
} from "../../store/navSlice";
import {
    selectAudioState,
    selectPlayingAya,
    selectTrackDuration,
    stop,
} from "../../store/playerSlice";
import {
    selectExerciseLevel,
    selectExerciseMemorized,
    selectFollowPlayer,
    selectRandomAutoRecite,
    selectRepeat,
    setFollowPlayer,
    setRepeat,
} from "../../store/settingsSlice";
import { showToast } from "../../store/uiSlice";
import { ExerciseSettings } from "./Settings";

// const useForceUpdate = useCallback(() => updateState({}), []);
// const useForceUpdate = () => useState()[1];

const Step = {
    unknown: -1,
    intro: 0,
    reciting: 1,
    typing: 2,
    results: 3,
};

const Exercise = () => {
    const app = useContext(AppContext);
    // const player = useContext(PlayerContext);
    const appHeight = useSelector(selectAppHeight);
    const isNarrow = useSelector(selectIsNarrow);

    const exerciseLevel = useSelector(selectExerciseLevel);
    const randomAutoRecite = useSelector(selectRandomAutoRecite);
    const exerciseMemorized = useSelector(selectExerciseMemorized);

    const [currStep, setCurrStep] = useState(Step.unknown);
    const selectStart = useSelector(selectStartSelection);
    const [verse, setVerse] = useState(selectStart);
    const [duration, setDuration] = useState(-1);
    const [remainingTime, setRemainingTime] = useState(-1);
    const [counterInterval, setCounterInterval] = useState(null);
    const [writtenText, setWrittenText] = useState("");
    const [wrongWord, setWrongWord] = useState(-1);
    const [missingWords, setMissingWords] = useState(0);
    const verseList = quranText;
    const normVerseList = quranNormalizedText;
    const [quickMode, setQuickMode] = useState(0);
    const pagesCount = useSelector(selectPagesCount);
    const isWide = useSelector(selectIsWide);
    const isCompact = useSelector(selectIsCompact);
    const dispatch = useDispatch();
    const history = useHistory();
    const audio = useContext(AudioContext);
    const playingAya = useSelector(selectPlayingAya);
    const repeat = useSelector(selectRepeat);
    const followPlayer = useSelector(selectFollowPlayer);
    const trackDuration = useSelector(selectTrackDuration);
    const trigger = "exercise";
    const audioState = useSelector(selectAudioState);

    useEffect(() => {
        let saveRepeat, saveFollowPlayer;
        if (repeat !== AudioRepeat.verse) {
            saveRepeat = selectRepeat;
            dispatch(setRepeat(AudioRepeat.verse));
        }
        if (followPlayer !== true) {
            saveFollowPlayer = followPlayer;
            dispatch(setFollowPlayer(true));
        }
        return () => {
            if (saveRepeat !== undefined) {
                dispatch(setRepeat(saveRepeat));
            }
            if (saveFollowPlayer !== undefined) {
                dispatch(setFollowPlayer(saveFollowPlayer));
            }
        };
    }, [repeat, followPlayer, dispatch]);

    const isNarrowLayout = () => {
        return !(isWide || isCompact || pagesCount > 1);
    };

    const checkVerseLevel = (new_verse) => {
        const text = quranText?.[new_verse];
        const length = text.length;
        switch (parseInt(exerciseLevel)) {
            case 0:
                if (!length.between(1, 50)) {
                    return false;
                }
                break;
            case 1:
                if (!length.between(51, 150)) {
                    return false;
                }
                break;
            case 2:
                if (!length.between(151, 300)) {
                    return false;
                }
                break;
            default:
                if (!(length > 200)) {
                    return false;
                }
        }
        //Length is good, check memorized
        if (exerciseMemorized === false) {
            const { sura, aya } = ayaIdInfo(new_verse);
            const page = getPageIndex(sura, aya);
            const { hifzRanges } = app;

            const hifzRange = hifzRanges.find((r) => {
                return (
                    r.sura === sura && page >= r.startPage && page <= r.endPage
                );
            });
            if (hifzRange) {
                return false; //verse is memorized,
            }
        }
        return true;
    };

    const gotoRandomVerse = (e) => {
        dispatch(stop());
        // player.stop();
        // player.setPlayingAya(-1);
        let new_verse;
        do {
            new_verse = Math.floor(Math.random() * verseList.length);
        } while (!checkVerseLevel(new_verse));
        dispatch(gotoAya(history, new_verse, { sel: true, keepMask: true }));
        // app.gotoAya(new_verse, { sel: true, keepMask: true });
        // app.setMaskStart(new_verse + 1, true);
        // setCurrStep(Step.intro);
        // if (currStep === Step.intro && defaultButton) {
        //     defaultButton.focus();
        // }
        if (randomAutoRecite) {
            startReciting(e);
        }

        analytics.logEvent("get_random_verse", {
            trigger,
            level: exerciseLevel,
        });
    };

    const startReciting = (e) => {
        setCurrStep(Step.reciting);
        //app.setMaskStart(verse + 1, true);
        analytics.logEvent("exercise_play_audio", {
            trigger,
        });
    };

    const redoReciting = (e) => {
        setWrittenText("");
        startReciting(e);
        analytics.logEvent("redo_reciting", { trigger });
    };

    const stopCounter = useCallback(() => {
        if (counterInterval) {
            clearInterval(counterInterval);
            setCounterInterval(null);
        }
    }, [counterInterval]);

    const startAnswer = useCallback(() => {
        setTimeout(() => {
            audio.stop(true);
        });
        // stopCounter();
        setCurrStep(Step.typing);
    }, [audio]);

    const showIntro = useCallback(
        (e) => {
            audio.stop(true);
            setCurrStep(Step.intro);
            analytics.logEvent("exercise_go_back", { trigger });
        },
        [audio]
    );

    let resultsDefaultButton =
        localStorage.getItem("resultsDefaultButton") || "typeNext";
    let defaultButton = null;

    useEffect(() => {
        audio.stop(true);
        setCurrStep(Step.intro);
        const handleKeyDown = ({ code }) => {
            if (code === "Escape") {
                analytics.logEvent("exercise_go_back", { trigger });
                showIntro();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        dispatch(gotoAya(history));
        return () => {
            audio.stop(true);
            dispatch(setModalPopup(false));
            // app.hideMask();
            dispatch(hideMask());
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [audio, dispatch, history, showIntro]);

    useEffect(() => {
        setVerse(selectStart);
        setWrittenText("");
        if (currStep === Step.results) {
            setCurrStep(Step.intro);
        } else {
            dispatch(setMaskStart(selectStart + 1, true));
            // app.setMaskStart(
            //     app.selectStart + (currStep === Step.typing ? 0 : 1),
            //     true
            // );
        }
    }, [currStep, dispatch, selectStart]);

    useEffect(() => {
        if (defaultButton) {
            defaultButton.focus();
        }
        switch (currStep) {
            case Step.typing:
                // app.setMaskStart(verse);
                // dispatch(setMaskStart(verse));
                dispatch(setModalPopup(true)); //block outside selection
                // app.setMaskStart(app.selectStart, true);
                dispatch(setMaskStart(selectStart, true));
                break;
            case Step.reciting:
                setTimeout(() => {
                    audio.play();
                }, 100);
                dispatch(setModalPopup(true)); //block outside selection
                // app.setMaskStart(app.selectStart + 1, true);
                dispatch(setMaskStart(selectStart + 1, true));
                break;
            case Step.results:
                //if correct answer, save number of verse letters in Firebase
                // app.setMaskStart(app.selectStart + 1, true);
                dispatch(setMaskStart(selectStart + 1, true));
                dispatch(setModalPopup(false));
                break;
            case Step.intro:
                // app.setMaskStart(verse + 1, true);
                dispatch(setMaskStart(verse + 1, true));
            // eslint-disable-next-line no-fallthrough
            default:
                dispatch(setModalPopup(false)); //allow selecting outside
        }
    }, [audio, currStep, defaultButton, dispatch, selectStart, verse]);

    //monitor player to start answer upon player ends
    useEffect(() => {
        if (audioState === AudioState.stopped) {
            stopCounter();
            if ([Step.reciting].includes(currStep)) {
                analytics.logEvent("start_typing", {
                    trigger: "exercise_audio",
                });
                startAnswer();
            }
        }
        if (
            [Step.typing, Step.intro, Step.results].includes(currStep) &&
            audioState === AudioState.playing
        ) {
            // app.gotoAya(player.playingAya, { sel: true });
            dispatch(gotoAya(history, playingAya, { sel: true }));
            setTimeout(startReciting, 200);
        }

        if (audioState === AudioState.playing) {
            // setDuration(audio.trackDuration());
            setRemainingTime(audio.trackRemainingTime());
            stopCounter();
            setCounterInterval(
                setInterval(() => {
                    setRemainingTime(audio.trackRemainingTime());
                }, 1000)
            );
        }
    }, [
        audio,
        audioState,
        currStep,
        dispatch,
        history,
        playingAya,
        startAnswer,
        stopCounter,
    ]);

    const renderCounter = (sqSize, strokeWidth, progress, target) => {
        if (counterInterval) {
            // SVG centers the stroke width on the radius, subtract out so circle fits in square
            const radius = (sqSize - strokeWidth) / 2;
            // Enclose cicle in a circumscribing square
            // const viewBox = `0 0 ${sqSize} ${sqSize}`;
            // Arc length at 100% coverage is the circle circumference
            const dashArray = radius * Math.PI * 2;
            // Scale 100% coverage overlay with the actual percent
            const percentage = progress / target;
            const dashOffset = dashArray - dashArray * percentage;
            return (
                <svg
                    width={sqSize}
                    height={sqSize}
                    viewBox={`0 0 ${sqSize} ${sqSize}`}
                >
                    <circle
                        className="circle-background"
                        cx={sqSize / 2}
                        cy={sqSize / 2}
                        r={radius}
                        strokeWidth={`${strokeWidth}px`}
                    />
                    <circle
                        className="circle-progress"
                        cx={sqSize / 2}
                        cy={sqSize / 2}
                        r={radius}
                        strokeWidth={`${strokeWidth}px`}
                        // Start progress marker at 12 O'Clock
                        transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
                        style={{
                            strokeDasharray: dashArray,
                            strokeDashoffset: dashOffset,
                        }}
                    />
                    <text
                        className="circle-text"
                        x="50%"
                        y="50%"
                        dy=".3em"
                        textAnchor="middle"
                    >
                        {`${progress}`}
                    </text>
                </svg>
            );
        }
    };

    const moveToNextVerse = () => {
        // app.gotoAya(verse + 1, { sel: true, keepMask: true });
        dispatch(gotoAya(history, verse + 1));
    };

    const reciteNextVerse = (e) => {
        localStorage.setItem("resultsDefaultButton", "reciteNext");
        startReciting();
        setTimeout(moveToNextVerse);
        analytics.logEvent("recite_next_verse", { trigger });
        // app.setMaskStart(verse + 2, true);
    };

    const typeNextVerse = (e) => {
        localStorage.setItem("resultsDefaultButton", "typeNext");
        // app.setMaskStart(verse + 1);
        setWrittenText("");
        startAnswer();
        setTimeout(moveToNextVerse);
        // if (defaultButton) {
        //     defaultButton.focus();
        // }
        analytics.logEvent("type_next_verse", { trigger });
    };

    const renderTitle = () => {
        switch (currStep) {
            case Step.intro:
                return renderIntroTitle();

            case Step.typing:
                return renderTypingTitle();

            case Step.results:
                return renderResultsTitle();

            case Step.reciting:
                return renderRecitingTitle();
            default:
                break;
        }
    };

    const onMoveNext = (offset) => {
        // app.gotoAya(verse + offset, { sel: true, keepMask: true });
        dispatch(
            gotoAya(history, verse + offset, { sel: true, keepMask: true })
        );
    };

    const renderIntro = () => {
        if (isNarrowLayout()) {
            return "";
        }
        return (
            <div className="ContentFrame">
                <VerseInfo trigger="exercise_intro" onMoveNext={onMoveNext} />
                <VerseText copy={true} bookmark={true} />
                <div className="FootNote">
                    <String id="exercise_intro" />
                </div>
                <hr />
                <TafseerView
                    verse={verse}
                    showVerseText={false}
                    bookmark={true}
                    copy={true}
                    onMoveNext={onMoveNext}
                    trigger={trigger}
                />
                <hr />
                <div>
                    <String id="random_exercise" />
                </div>
                <ExerciseSettings />

                <ActivityChart activity="chars" />
            </div>
        );
    };

    const onClickType = (e) => {
        const trg = e.target.getAttribute("trigger") || trigger;
        analytics.logEvent("start_typing", { trigger: trg });
        startAnswer();
    };

    const renderIntroTitle = () => {
        const narrow = isNarrow;
        return (
            <>
                {isNarrowLayout() ? (
                    <div className="TitleNote">
                        <String id="exercise_intro" />
                    </div>
                ) : null}
                <div className="TitleButtons">
                    <VerseInfo
                        trigger="exercise_intro_title"
                        show={isNarrowLayout()}
                    />
                    <div className="ButtonsBar">
                        <button
                            onClick={onClickType}
                            trigger="exercise_intro"
                            ref={(ref) => {
                                defaultButton = ref;
                            }}
                        >
                            {narrow ? (
                                <Icon icon={faKeyboard} />
                            ) : (
                                <String id="answer" />
                            )}
                        </button>
                        <button onClick={startReciting}>
                            {narrow ? (
                                <Icon icon={faPlayCircle} />
                            ) : (
                                <String id="start" />
                            )}
                        </button>
                        <button onClick={typeNextVerse}>
                            <String id="type_next" />
                        </button>
                        <button onClick={gotoRandomVerse}>
                            {narrow ? (
                                <Icon icon={faRandom} />
                            ) : (
                                <String id="new_verse" />
                            )}
                        </button>
                    </div>
                </div>
            </>
        );
    };

    const onUpdateText = (text) => {
        setWrittenText(text);
        //test written words ( except the last one )
        setWrongWord(-1);
        setMissingWords(0);
        if (testAnswer(text)) {
            setTimeout(() => {
                if (quickMode > 0) {
                    dispatch(showToast("success_write_next"));
                    typeNextVerse();
                    return;
                }
                // app.setMaskStart(app.selectStart + 1, true);
                setCurrStep(Step.results);
            }, 500);
        }
        // forceUpdate();
    };

    const onFinishedTyping = () => {
        testAnswer(writtenText);
        //app.setMaskStart(app.selectStart + 1, true);
        setCurrStep(Step.results);
    };

    const testAnswer = (answerText) => {
        const normVerse = normVerseList[verse].trim();
        const normAnswerText = normalizeText(answerText).trim();
        const correctWords = normVerse.split(/\s+/);
        if (!answerText.trim().length) {
            setMissingWords(correctWords.length);
            return false;
        }
        const answerWords = normAnswerText.split(/\s+/);

        let wrongWord = -1,
            index;

        for (index = 0; index < answerWords.length; index++) {
            const correctWord = correctWords[index];
            const answerWord =
                index < answerWords.length ? answerWords[index] : "";
            if (answerWord !== correctWord) {
                wrongWord = index;
                break;
            }
        }
        if (wrongWord === -1 && answerWords.length > correctWords.length) {
            //wrote extra words
            wrongWord = correctWords.length;
        }

        setWrongWord(wrongWord);
        setMissingWords(correctWords.length - answerWords.length);
        if (quickMode === 2 && wrongWord === -1 && answerWords.length >= 3) {
            const typed_chars = app.logTypedVerse(verse, 3);
            analytics.logEvent("exercise_quick_success", {
                ...verseLocation(verse),
                typed_chars,
                trigger,
            });
            return true;
        }
        const success =
            wrongWord === -1 && correctWords.length === answerWords.length;

        if (success) {
            const typed_chars = app.logTypedVerse(verse);
            analytics.logEvent("exercise_success", {
                ...verseLocation(verse),
                typed_chars,
                trigger,
            });
        }
        return success;
    };

    const renderTypingTitle = () => {
        // const correct = wrongWord === -1;
        return (
            <div className="TitleButtons">
                <VerseInfo
                    trigger="exercise_typing_title"
                    onClick={onFinishedTyping}
                />
                <div className="ButtonsBar">
                    <button onClick={startReciting}>
                        <String id="start" />
                    </button>
                    <button onClick={onFinishedTyping}>
                        <String id="check" />
                    </button>
                    <button onClick={showIntro}>
                        <String id="home" />
                    </button>
                </div>
            </div>
        );
    };

    const renderCursor = () => {
        return <span className="TypingCursor"></span>;
    };

    const renderText = () => {
        if (!writtenText) {
            return <String id="writing_prompt" />;
        }
        return (
            <>
                {writtenText}
                {renderCursor()}
            </>
        );
    };

    const onUpdateQuickMode = ({ target }) => {
        //setQuickMode(target.checked);
        setQuickMode(parseInt(target.value));
        defaultButton.focus();
    };

    const renderTypingConsole = () => {
        const correct = isTypingCorrect();
        return (
            <>
                <div
                    style={{
                        position: "relative",
                        height: appHeight - 248, //keyboard and title heights
                    }}
                >
                    <div
                        tabIndex="0"
                        ref={(ref) => {
                            defaultButton = ref;
                        }}
                        className={
                            "TypingConsole" +
                            (!writtenText.length
                                ? " empty"
                                : correct
                                ? " Correct"
                                : " Wrong")
                        }
                    >
                        {renderText()}
                    </div>
                    <div className="RadioGroup">
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name="quickMode"
                                    value={0}
                                    checked={quickMode === 0}
                                    onChange={onUpdateQuickMode}
                                />
                                <span>
                                    <String id="quick_mode_0" />
                                </span>
                            </label>
                        </div>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name="quickMode"
                                    value={1}
                                    checked={quickMode === 1}
                                    onChange={onUpdateQuickMode}
                                />
                                <span>
                                    <String id="quick_mode_1" />
                                </span>
                            </label>
                        </div>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name="quickMode"
                                    value={2}
                                    checked={quickMode === 2}
                                    onChange={onUpdateQuickMode}
                                />
                                <span>
                                    <String id="quick_mode_2" />
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
                <AKeyboard
                    initText={writtenText}
                    onUpdateText={onUpdateText}
                    onEnter={onFinishedTyping}
                    onCancel={showIntro}
                />
            </>
        );
    };

    const redoTyping = (e) => {
        setWrittenText("");
        startAnswer();
        analytics.logEvent("start_typing", { trigger: "exercise_redo" });
    };

    const renderResultsTitle = () => {
        return (
            <div className="TitleButtons">
                <VerseInfo trigger="exercise_result_title" />
                <div className="ButtonsBar">
                    {isCorrect() ? (
                        //correct answer
                        <>
                            <button
                                ref={(ref) => {
                                    if (resultsDefaultButton === "typeNext") {
                                        defaultButton = ref;
                                    }
                                }}
                                onClick={typeNextVerse}
                            >
                                <String id="type_next" />
                            </button>
                            <button
                                ref={(ref) => {
                                    if (resultsDefaultButton === "reciteNext") {
                                        defaultButton = ref;
                                    }
                                }}
                                onClick={reciteNextVerse}
                            >
                                <String id="recite_next" />
                            </button>
                            <button onClick={gotoRandomVerse}>
                                <String id="new_verse" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                ref={(ref) => {
                                    defaultButton = ref;
                                }}
                                onClick={onClickType}
                                trigger="exercise_retry"
                            >
                                <String id="correct" />
                            </button>
                            <button onClick={startReciting}>
                                <String id="start" />
                            </button>
                            <button onClick={showIntro}>
                                <String id="home" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const isCorrect = () => wrongWord === -1 && missingWords === 0;
    const isTypingCorrect = () =>
        wrongWord === -1 || wrongWord === writtenText.split(/\s+/).length - 1;

    const renderSuccessResultsReport = () => {
        return (
            <>
                <div className="ButtonsBar">
                    <button onClick={redoTyping}>
                        <String id="redo" />
                    </button>
                    <button onClick={redoReciting}>
                        <String id="start" />
                    </button>
                    <button onClick={showIntro}>
                        <String id="home" />
                    </button>

                    {/* <CommandButton command="Settings" trigger={trigger} /> */}
                </div>
                <TafseerView
                    verse={verse}
                    bookmark={true}
                    copy={true}
                    onMoveNext={onMoveNext}
                    trigger={trigger}
                />
                <hr />
                <div>
                    <String id="random_exercise" />
                </div>
                <ExerciseSettings />
                <hr />
                <ActivityChart activity="chars" />
            </>
        );
    };

    const renderResults = () => {
        const answerWords = writtenText.trim().split(/\s+/);

        const renderMessage = () => {
            if (isCorrect()) {
                return (
                    <div>
                        <span className="Correct">
                            <Icon icon={faThumbsUp} />
                        </span>{" "}
                        <String id="correct_answer" />
                    </div>
                );
            }
            return (
                <div>
                    <span className="Wrong">
                        <Icon icon={faThumbsDown} />
                    </span>{" "}
                    <String id="wrong_answer" />
                </div>
            );
        };

        const renderMissingWords = () => {
            if (!missingWords) {
                return "";
            }
            return new Array(missingWords + 1)
                .join("0")
                .split("")
                .map((x, index) => (
                    <span key={index} className="Wrong">
                        {" ? "}
                    </span>
                ));
        };

        return (
            <div className="ContentFrame">
                {renderMessage()}
                <h3 className="TypedVerseText">
                    {answerWords.map((word, index) => (
                        <span
                            key={index}
                            className={
                                wrongWord === -1 || index < wrongWord
                                    ? "Correct"
                                    : "Wrong"
                            }
                        >
                            {word}{" "}
                        </span>
                    ))}
                    {renderMissingWords()}
                </h3>
                {isCorrect() ? (
                    renderSuccessResultsReport()
                ) : (
                    <>
                        <hr />
                        <h3 className="Correct">
                            <VerseText copy={true} trigger="correct_exercise" />
                        </h3>
                        <hr />
                        <TafseerView
                            verse={verse}
                            showVerseText={false}
                            bookmark={true}
                            copy={true}
                            onMoveNext={onMoveNext}
                            trigger={trigger}
                        />
                    </>
                )}
            </div>
        );
    };

    const renderRecitingTitle = () => {
        return (
            <div className="TitleButtons">
                <VerseInfo trigger="reciting_title" show={isNarrowLayout()} />
                <span className="TrackDuration">
                    {renderCounter(32, 3, Math.floor(remainingTime), duration)}
                </span>
                <div className="ButtonsBar">
                    <button
                        onClick={onClickType}
                        trigger="exercise_reciter"
                        ref={(ref) => {
                            defaultButton = ref;
                        }}
                    >
                        <String id="answer" />
                    </button>
                    {/* <button onClick={gotoRandomVerse}>
                        <String id="new_verse" />
                    </button> */}
                    <button onClick={showIntro}>
                        <String id="home" />
                    </button>
                </div>
            </div>
        );
    };

    const renderReciting = () => {
        if (isNarrowLayout()) {
            return "";
        }
        return (
            <div className="ContentFrame">
                <VerseInfo trigger="exercise_reciting" />
                <VerseText />
                <div className="FootNote">
                    <String id="exercise_intro" />
                </div>
                <hr />
                <TafseerView
                    verse={verse}
                    showVerseText={false}
                    bookmark={true}
                    copy={true}
                    onMoveNext={onMoveNext}
                    trigger={trigger}
                />
            </div>
        );
    };

    const renderContent = () => {
        switch (currStep) {
            case Step.intro:
                return renderIntro();
            case Step.reciting:
                return renderReciting();
            case Step.typing:
                return renderTypingConsole();
            case Step.results:
                return renderResults();
            default:
                break;
        }
    };

    return (
        <>
            <div className="Title">{renderTitle()}</div>
            <div className="PopupBody" style={{ maxHeight: appHeight - 50 }}>
                {renderContent()}
            </div>
        </>
    );
};

export default Exercise;
