//TODO: replace rendering functions with components
import {
    faPlayCircle,
    faRandom,
    faThumbsDown,
    faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { FormattedMessage as String } from "react-intl";
import AKeyboard from "../AKeyboard/AKeyboard";
import { ActivityChart } from "../Hifz";
import { normalizeText } from "./../../services/utils";
import { VerseInfo, VerseText } from "./../Widgets";
import { TafseerView } from "./Tafseer";

import { faKeyboard } from "@fortawesome/free-regular-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { quranNormalizedText, quranText } from "../../App";
import useSnapHeightToBottomOf from "../../hooks/useSnapHeightToBottomOff";
import { AppRefs } from "../../RefsProvider";
import { analytics } from "../../services/Analytics";
import { ayaIdInfo, getPageIndex, verseLocation } from "../../services/QData";
import { logTypedVerse, selectHifzRanges } from "../../store/dbSlice";
import { selectAppHeight, selectIsNarrow } from "../../store/layoutSlice";
import {
    gotoAya,
    hideMask,
    selectStartSelection,
    setMaskShift,
    showMask,
} from "../../store/navSlice";
import {
    AudioState,
    selectAudioState,
    selectRemainingTime,
    selectTrackDuration,
} from "../../store/playerSlice";
import {
    AudioRepeat,
    selectExerciseLevel,
    selectExerciseMemorized,
    selectRandomAutoRecite,
} from "../../store/settingsSlice";
import { setModalPopup, showToast } from "../../store/uiSlice";
import { ExerciseSettings } from "../ExerciseSettings";

const Step = {
    unknown: "unknown",
    intro: "intro",
    reciting: "reciting",
    typing: "typing",
    results: "results",
};

const Exercise = () => {
    const [currStep, setCurrentStep] = useState(Step.intro);
    const appHeight = useSelector(selectAppHeight);
    const isNarrow = useSelector(selectIsNarrow);

    const exerciseLevel = useSelector(selectExerciseLevel);
    const randomAutoRecite = useSelector(selectRandomAutoRecite);
    const exerciseMemorized = useSelector(selectExerciseMemorized);

    const selectStart = useSelector(selectStartSelection);
    const [verse, setVerse] = useState(selectStart);
    const [writtenText, setWrittenText] = useState("");
    const [wrongWord, setWrongWord] = useState(-1);
    const [missingWords, setMissingWords] = useState(0);
    const verseList = quranText;
    const normVerseList = quranNormalizedText;
    const [quickMode, setQuickMode] = useState(0);
    const dispatch = useDispatch();
    const history = useHistory();
    const audio = useContext(AppRefs).get("audio");
    const duration = useSelector(selectTrackDuration);
    const remainingTime = useSelector(selectRemainingTime);
    const trigger = "exercise";
    const audioState = useSelector(selectAudioState);
    const hifzRanges = useSelector(selectHifzRanges);
    // const isNarrowLayout = useSelector(selectIsNarrowLayout);
    const bodyRef = useSnapHeightToBottomOf(appHeight - 15, currStep);
    const typingConsoleRef = useSnapHeightToBottomOf(appHeight - 240, currStep);
    const cursorRef = useRef();

    const setCurrStep = (step) => {
        setCurrentStep(step);
    };

    useEffect(() => {
        if (cursorRef.current && currStep === Step.typing) {
            setTimeout(
                () =>
                    cursorRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "center",
                    }),
                5
            );
        }
    }, [writtenText, currStep]);

    useEffect(() => {
        return () => {
            dispatch(hideMask());
        };
    }, [dispatch]);

    // useEffect(() => {
    //     if (repeat !== AudioRepeat.noRepeat) {
    //         setSavedRepeat(repeat);
    //         dispatch(setRepeat(AudioRepeat.noRepeat));
    //     }
    //     if (followPlayer !== true) {
    //         setSavedFollowPlayer(followPlayer);
    //         dispatch(setFollowPlayer(true));
    //     }
    // }, [repeat, followPlayer, dispatch]);

    // useEffect(() => {
    //     return () => {
    //         if (savedRepeat !== undefined) {
    //             dispatch(setRepeat(savedRepeat));
    //         }
    //         if (savedFollowPlayer !== undefined) {
    //             dispatch(setFollowPlayer(savedFollowPlayer));
    //         }
    //     };
    // }, [dispatch, savedFollowPlayer, savedRepeat]);

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
            // const { hifzRanges } = app;

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
        // dispatch(stop(audio));
        audio.stop();
        let new_verse;
        do {
            new_verse = Math.floor(Math.random() * verseList.length);
        } while (!checkVerseLevel(new_verse));
        dispatch(gotoAya(history, new_verse));

        if (randomAutoRecite) {
            audio.play(new_verse, AudioRepeat.noRepeat);
        }

        analytics.logEvent("get_random_verse", {
            trigger,
            level: exerciseLevel,
        });
    };

    const startReciting = (e) => {
        // setCurrStep(Step.reciting);
        audio.play(verse, AudioRepeat.noRepeat);
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

    // const stopCounter = useCallback(() => {
    //     if (counterInterval) {
    //         clearInterval(counterInterval);
    //         setCounterInterval(null);
    //     }
    // }, [counterInterval]);

    const startAnswer = useCallback(() => {
        // setTimeout(() => {
        audio.stop();
        // });
        // stopCounter();
        setCurrStep(Step.typing);
    }, [audio]);

    const showIntro = useCallback(
        (e) => {
            audio.stop();
            setCurrStep(Step.intro);
            analytics.logEvent("exercise_go_back", { trigger });
        },
        [audio]
    );

    const goBack = useCallback(
        (e) => {
            audio.stop();
            setCurrStep((currStep) => {
                switch (currStep) {
                    case Step.reciting:
                        return Step.typing;
                    default:
                        return Step.intro;
                }
            });
            analytics.logEvent("exercise_go_back", { trigger });
        },
        [audio]
    );

    let resultsDefaultButton =
        localStorage.getItem("resultsDefaultButton") || "typeNext";
    let defaultButton = null;

    useEffect(() => {
        // audio.stop(true);
        // setCurrStep(Step.intro);
        const handleKeyDown = ({ code }) => {
            if (code === "Escape") {
                goBack();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        // dispatch(gotoAya(history));
        return () => {
            // audio.stop(true);
            dispatch(setModalPopup(false));
            // app.hideMask();
            // dispatch(hideMask());
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [dispatch, goBack]);

    //selected aya has changed
    useEffect(() => {
        setVerse(selectStart);
        setWrittenText("");
    }, [selectStart]);

    useEffect(() => {
        dispatch(showMask());
        if (currStep !== Step.typing) {
            dispatch(setMaskShift(1));
        }
    }, [currStep, dispatch, selectStart]);

    useEffect(() => {
        setCurrStep(Step.intro);
    }, [selectStart]);

    useEffect(() => {
        if (defaultButton) {
            defaultButton.focus();
        }
        switch (currStep) {
            case Step.typing:
                // dispatch(setMaskStart(verse));
                dispatch(setModalPopup(true)); //block outside selection
                dispatch(setMaskShift(0));
                typingConsoleRef.current?.focus();
                break;
            case Step.reciting:
                // setTimeout(() => {
                //     audio.play();
                // }, 100);
                dispatch(setModalPopup(true)); //block outside selection
                dispatch(setMaskShift(1));
                break;
            case Step.results:
                //if correct answer, save number of verse letters in Firebase
                dispatch(setMaskShift(1));
                dispatch(setModalPopup(false));
                break;
            case Step.intro:
                // app.setMaskStart(verse + 1, true);
                dispatch(setMaskShift(1));
            // eslint-disable-next-line no-fallthrough
            default:
                dispatch(setModalPopup(false)); //allow selecting outside
        }
    }, [currStep, defaultButton, dispatch, typingConsoleRef]);

    //monitor player to start answer upon player ends
    useEffect(() => {
        setCurrStep((currStep) => {
            switch (audioState) {
                case AudioState.stopped:
                    if (currStep === Step.reciting) {
                        return Step.typing;
                    }
                    break;
                case AudioState.playing:
                case AudioState.buffering:
                    return Step.reciting;
                default:
            }
            return currStep; //no change
        });
    }, [audioState]);

    const renderCounter = (sqSize, strokeWidth, progress, target) => {
        if (
            [
                AudioState.playing,
                AudioState.buffering,
                AudioState.paused,
            ].includes(audioState)
        ) {
            // SVG centers the stroke width on the radius, subtract out so circle fits in square
            const radius = (sqSize - strokeWidth) / 2;
            // Enclose circle in a circumscribing square
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
        moveToNextVerse();
        audio.play(verse + 1, AudioRepeat.noRepeat);
        analytics.logEvent("recite_next_verse", { trigger });
        // app.setMaskStart(verse + 2, true);
    };

    const typeNextVerse = (e) => {
        localStorage.setItem("resultsDefaultButton", "typeNext");
        // app.setMaskStart(verse + 1);
        setWrittenText("");
        startAnswer();
        moveToNextVerse();
        setTimeout(() => setCurrStep(Step.typing));
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
        dispatch(gotoAya(history, verse + offset, { sel: true }));
    };

    const renderIntro = () => {
        return (
            <div className="PopupBody" ref={bodyRef}>
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
                {/* {isNarrowLayout ? (
                    <div className="TitleNote">
                        <String id="exercise_intro" />
                    </div>
                ) : null} */}
                <div className="TitleButtons">
                    <VerseInfo
                        trigger="exercise_intro_title"
                        // show={isNarrowLayout}
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
                    dispatch(showToast({ id: "success_write_next" }));
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
        const missingWordsCount = correctWords.length - answerWords.length;
        setMissingWords(missingWordsCount >= 0 ? missingWordsCount : 0);
        if (quickMode === 2 && wrongWord === -1 && answerWords.length >= 3) {
            const typed_chars = dispatch(logTypedVerse(verse, 3));
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
            const typed_chars = dispatch(logTypedVerse(verse));
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
        return <span className="TypingCursor" ref={cursorRef}></span>;
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
        // defaultButton.focus();//to avoid changing the radio value upon typing
    };

    const renderTypingConsole = () => {
        const correct = isTypingCorrect();
        return (
            <>
                <div>
                    <select
                        onChange={onUpdateQuickMode}
                        value={quickMode}
                        style={{ width: "100%" }}
                    >
                        <option value={0}>
                            <String id="quick_mode_0" />
                        </option>
                        <option value={1}>
                            <String id="quick_mode_1" />
                        </option>
                        <option value={2}>
                            <String id="quick_mode_2" />
                        </option>
                    </select>
                </div>
                <div
                    tabIndex={0}
                    ref={typingConsoleRef}
                    className={
                        "TypingConsole" +
                        (!writtenText.length
                            ? " empty"
                            : correct
                            ? " Correct"
                            : " Wrong")
                    }
                    style={{
                        position: "absolute",
                        left: 15,
                        right: 15,
                        // maxHeight: 44,
                    }}
                >
                    {renderText()}
                </div>
                <div className="PopupBody VEnd" ref={bodyRef}>
                    <AKeyboard
                        initText={writtenText}
                        onUpdateText={onUpdateText}
                        onEnter={onFinishedTyping}
                        onCancel={showIntro}
                    />
                </div>
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
            <div className="PopupBody" ref={bodyRef}>
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
                <VerseInfo
                    trigger="reciting_title"
                    // show={isNarrowLayout}
                />
                <span className="TrackDuration">
                    {renderCounter(
                        32,
                        3,
                        Math.floor(remainingTime || 0),
                        duration
                    )}
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
        return (
            // !isNarrowLayout &&
            <div className="PopupBody" ref={bodyRef}>
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
            {renderContent()}
        </>
    );
};

export default Exercise;
