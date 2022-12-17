const QData = {
  arSuraNames:
    "الفاتحة,البقرة,ال عمران,النساء,المائدة,الانعام,الاعراف,الانفال,التوبة,يونس,هود,يوسف,الرعد,ابراهيم,الحجر,النحل,الاسراء,الكهف,مريم,طه,الانبياء,الحج,المؤمنون,النور,الفرقان,الشعراء,النمل,القصص,العنكبوت,الروم,لقمان,السجدة,الاحزاب,سبأ,فاطر,يس,الصافات,ص,الزمر,غافر,فصلت,الشورى,الزخرف,الدخان,الجاثية,الاحقاف,محمد,الفتح,الحجرات,ق,الذاريات,الطور,النجم,القمر,الرحمن,الواقعة,الحديد,المجادلة,الحشر,الممتحنة,الصف,الجمعة,المنافقون,التغابن,الطلاق,التحريم,الملك,القلم,الحاقة,المعارج,نوح,الجن,المزمل,المدثر,القيامة,الانسان,المرسلات,النبا,النازعات,عبس,التكوير,الانفطار,المطففين,الانشقاق,البروج,الطارق,الاعلى,الغاشية,الفجر,البلد,الشمس,الليل,الضحى,الشرح,التين,العلق,القدر,البينة,الزلزلة,العاديات,القارعة,التكاثر,العصر,الهمزة,الفيل,قريش,الماعون,الكوثر,الكافرون,النصر,المسد,الاخلاص,الفلق,الناس".split(
      ","
    ),

  suraName: (index) => {
    return index < QData.arSuraNames.length
      ? QData.arSuraNames[index]
      : "(not found)";
  },

  pagePart: function getPagePart(nPage) {
    for (var i = 0, len = QData.parts.length; i < len; i++) {
      var part = QData.parts[i];
      if (nPage >= part.p && nPage <= part.ep) {
        return i + 1;
      }
    }
    return 30;
  },

  /**
   * Zero based with numeric params
   * If string params, it is one based
   *
   * @param {number} sura
   * @param {number} aya
   * @returns {number} absolute aya index
   */
  ayaID: (sura, aya) => {
    if (typeof sura === "string") {
      sura = parseInt(sura) - 1;
    }
    if (typeof aya === "string") {
      aya = parseInt(aya) - 1;
    }
    let id = 0;

    //Add up verses count of previous suras
    for (var s = 0; s < sura; s++) {
      id += QData.sura_info[s].ac;
    }

    //Add current sura aya index
    id += aya;
    return id;
  },

  /**
   * Returns sura and aya indices given AyaId
   */
  ayaIdInfo: (aya_id) => {
    let id = 0;
    for (var s = 0; s < QData.sura_info.length; s++) {
      let ac = QData.sura_info[s].ac;
      if (id + ac > aya_id) {
        return {sura: s, aya: aya_id - id};
      }
      id += ac;
    }
    return {sura: 0, aya: 0};
  },

  /**
   * For analytics purpose
   */
  verseLocation: (verse) => {
    const info = QData.ayaIdInfo(verse);
    return {
      verse: `${info.sura + 1}:${info.aya + 1}`,
      chapter: QData.suraName(info.sura),
      chapter_num: info.sura + 1,
    };
  },

  /**
   * Returns page index by aya ID
   */
  ayaIdPage: (aya_id) => {
    let {sura, aya} = QData.ayaIdInfo(aya_id);
    return QData.ayaPage(sura, aya);
  },

  /**
   * Returns part index for a given verse
   *
   * @param {number} aya_id absolute verse index
   */
  ayaIdPart: (aya_id) => {
    const {sura: sIndex, aya: aIndex} = QData.ayaIdInfo(aya_id);
    for (let p = 0; p < QData.parts.length; p++) {
      const {s, a} = QData.parts[p];
      const [partSuraIndex, partAyaIndex] = [s - 1, a - 1];
      if (
        partSuraIndex > sIndex ||
        (partSuraIndex === sIndex && partAyaIndex > aIndex)
      ) {
        return p - 1; //passed
      }
    }
    return QData.parts.length - 1;
  },

  /**
   * Returns given part first verse absolute ID
   *
   * @param {number} part_index zero based part index
   */
  partAyaId: (part_index) => {
    const {s: suraNum, a: ayaNum} = QData.parts[part_index];
    return QData.ayaID(suraNum - 1, ayaNum - 1);
  },

  /**
   * Retuns aya ID by page index
   *
   * @param {number} page_index
   */
  pageAyaId: (page_index) => {
    let {s: sura, a: aya} = QData.pagesInfo[page_index];
    return QData.ayaID(sura - 1, aya - 1);
  },

  /**
   * Returns page Index by suraIndex and ayaIndex
   * @param {number} sura
   * @param {number} aya
   */
  //Index based
  ayaPage: function (sura, aya) {
    var page = QData.sura_info[sura].sp - 1;
    while (page < QData.pagesInfo.length - 1) {
      if (
        QData.pagesInfo[page + 1].s !== sura + 1 ||
        QData.pagesInfo[page + 1].a > aya + 1
      ) {
        return page;
      }
      page++;
    }
    return page;
  },

  nextAya: function (sura, aya) {
    var ret = {sura: sura, aya: aya};
    if (aya >= QData.sura_info[sura - 1].ac) {
      if (sura < 114) {
        ret.sura = sura + 1;
        ret.aya = 1;
      } else {
        return null; //last aya in Quran, no increment
      }
    } else {
      ret.sura = sura;
      ret.aya = aya + 1;
    }
    return ret;
  },

  prevAya: function (sura, aya) {
    var ret = {sura: sura, aya: aya};
    if (aya <= 1) {
      if (sura > 1) {
        ret.sura = sura - 1;
        ret.aya = QData.sura_info[ret.sura - 1].ac;
      } else {
        return ret;
      }
    } else {
      ret.sura = sura;
      ret.aya = aya - 1;
    }
    return ret;
  },

  compareVerses: function (infoL, infoR) {
    if (infoL.sura === infoR.sura) {
      if (infoL.aya === infoR.aya) {
        return 0;
      }
      return infoL.aya > infoR.aya ? 1 : -1;
    }

    return infoL.sura > infoR.sura ? 1 : -1;
  },

  /**
   * Returns sura index for a specific page number
   */
  pageSura: function (nPage, bStart) {
    for (var i = 0; i < 114; i++) {
      if (QData.sura_info[i].ep >= nPage) {
        return i;
      }
    }
    return 0;
  },

  surasCount: function getSuraCount() {
    return 114;
    //return QData.sura_info.length;
  },

  ayatCount: function getAyatCount() {
    return 6236;

    //for( var i=0, len= QData.sura_info.length, count=0 ; i < len ; i++ ){
    //	count += QData.sura_info[i].ac;
    //}
    //return count;
  },

  suraStartPage: (sura) => {
    return QData.sura_info[sura].sp - 1;
  },

  suraPageCount: function getSuraPageCount(ndx) {
    var sInfo = QData.sura_info[ndx];
    return sInfo.ep - sInfo.sp + 1;
  },

  partPageProgress: function getPartPageProgress(nPart, nPageNo) {
    var startPage = QData.parts[nPart].p;
    var endPage = QData.parts[nPart].ep;

    return ((nPageNo - startPage) * 100) / (endPage - startPage);
  },

  suraPageProgress: function GetSuraPageProgress(nSura, nPageNo) {
    var startPage = QData.sura_info[nSura].sp;
    var endPage = QData.sura_info[nSura].ep;

    return ((nPageNo - startPage) * 100) / (endPage - startPage);
  },

  rangeVerses: (sura, startPage, endPage) => {
    let [rangeStartVerse, rangeEndVerse] = [0, 0];
    const suraStartPage = QData.sura_info[sura].sp - 1;
    const suraEndPage = QData.sura_info[sura].ep - 1;
    const suraStartAya = QData.ayaID(sura, 0);
    if (suraStartPage === startPage) {
      rangeStartVerse = suraStartAya;
    } else {
      rangeStartVerse = QData.pageAyaId(startPage);
    }
    if (suraEndPage === endPage) {
      rangeEndVerse = suraStartAya + QData.sura_info[sura].ac - 1;
    } else {
      rangeEndVerse = QData.pageAyaId(endPage + 1) - 1;
    }

    return [rangeStartVerse, rangeEndVerse];
  },

  pages_count: 604,

  parts: [
    // {s:"start_sura", a:"start_aya", p:"start_page", ep:"end_page" }
    {s: 1, a: 1, es: 2, ea: 141, p: 1, ep: 21}, //1
    {s: 2, a: 142, es: 2, ea: 252, p: 22, ep: 41}, //2
    {s: 2, a: 253, es: 3, ea: 92, p: 42, ep: 62}, //3
    {s: 3, a: 93, es: 4, ea: 23, p: 62, ep: 81}, //4
    {s: 4, a: 24, es: 4, ea: 147, p: 82, ep: 101}, //5
    {s: 4, a: 148, es: 5, ea: 81, p: 102, ep: 121}, //6
    {s: 5, a: 82, es: 6, ea: 110, p: 121, ep: 141}, //7
    {s: 6, a: 111, es: 7, ea: 87, p: 142, ep: 161}, //8
    {s: 7, a: 88, es: 8, ea: 40, p: 162, ep: 181}, //9
    {s: 8, a: 41, es: 9, ea: 92, p: 182, ep: 201}, //10
    {s: 9, a: 93, es: 11, ea: 5, p: 201, ep: 221}, //11
    {s: 11, a: 6, es: 12, ea: 52, p: 222, ep: 241}, //12
    {s: 12, a: 53, es: 14, ea: 52, p: 242, ep: 261}, //13
    {s: 15, a: 1, es: 16, ea: 128, p: 262, ep: 281}, //14
    {s: 17, a: 1, es: 18, ea: 74, p: 282, ep: 301}, //15
    {s: 18, a: 75, es: 20, ea: 135, p: 302, ep: 321}, //16
    {s: 21, a: 1, es: 22, ea: 78, p: 322, ep: 341}, //17
    {s: 23, a: 1, es: 25, ea: 20, p: 342, ep: 361}, //18
    {s: 25, a: 21, es: 27, ea: 55, p: 362, ep: 381}, //19
    {s: 27, a: 56, es: 29, ea: 45, p: 382, ep: 401}, //20
    {s: 29, a: 46, es: 33, ea: 30, p: 402, ep: 421}, //21
    {s: 33, a: 31, es: 36, ea: 27, p: 422, ep: 441}, //22
    {s: 36, a: 28, es: 39, ea: 31, p: 442, ep: 461}, //23
    {s: 39, a: 32, es: 41, ea: 46, p: 462, ep: 481}, //24
    {s: 41, a: 47, es: 45, ea: 37, p: 482, ep: 502}, //25
    {s: 46, a: 1, es: 51, ea: 30, p: 502, ep: 521}, //26
    {s: 51, a: 31, es: 57, ea: 29, p: 522, ep: 541}, //27
    {s: 58, a: 1, es: 66, ea: 12, p: 542, ep: 561}, //28
    {s: 67, a: 1, es: 77, ea: 50, p: 562, ep: 581}, //29
    {s: 78, a: 1, es: 114, ea: 6, p: 582, ep: 604}, //30
  ],

  suraInPage: function (suraNum, pageNum) {
    var nSura = suraNum - 1;
    return (
      QData.sura_info[nSura].sp <= pageNum &&
      QData.sura_info[nSura].ep >= pageNum
    );
  },

  sura_info: [
    //{ sp:"start_page", t: { makky: 0, maddany:1 }, ac: "ayat count" }
    {sp: 1, ep: 1, t: 0, ac: 7},
    {sp: 2, ep: 49, t: 1, ac: 286},
    {sp: 50, ep: 76, t: 1, ac: 200},
    {sp: 77, ep: 106, t: 1, ac: 176},
    {sp: 106, ep: 127, t: 1, ac: 120},
    {sp: 128, ep: 150, t: 0, ac: 165},
    {sp: 151, ep: 176, t: 0, ac: 206},
    {sp: 177, ep: 186, t: 1, ac: 75},
    {sp: 187, ep: 207, t: 1, ac: 129},
    {sp: 208, ep: 221, t: 0, ac: 109},
    {sp: 221, ep: 235, t: 0, ac: 123},
    {sp: 235, ep: 248, t: 0, ac: 111},
    {sp: 249, ep: 255, t: 1, ac: 43},
    {sp: 255, ep: 261, t: 0, ac: 52},
    {sp: 262, ep: 267, t: 0, ac: 99},
    {sp: 267, ep: 281, t: 0, ac: 128},
    {sp: 282, ep: 293, t: 0, ac: 111},
    {sp: 293, ep: 304, t: 0, ac: 110},
    {sp: 305, ep: 312, t: 0, ac: 98},
    {sp: 312, ep: 321, t: 0, ac: 135},
    {sp: 322, ep: 331, t: 0, ac: 112},
    {sp: 332, ep: 341, t: 1, ac: 78},
    {sp: 342, ep: 349, t: 0, ac: 118},
    {sp: 350, ep: 359, t: 1, ac: 64},
    {sp: 359, ep: 366, t: 0, ac: 77},
    {sp: 367, ep: 376, t: 0, ac: 227},
    {sp: 377, ep: 385, t: 0, ac: 93},
    {sp: 385, ep: 396, t: 0, ac: 88},
    {sp: 396, ep: 404, t: 0, ac: 69},
    {sp: 404, ep: 410, t: 0, ac: 60},
    {sp: 411, ep: 414, t: 0, ac: 34},
    {sp: 415, ep: 417, t: 0, ac: 30},
    {sp: 418, ep: 427, t: 1, ac: 73},
    {sp: 428, ep: 434, t: 0, ac: 54},
    {sp: 434, ep: 440, t: 0, ac: 45},
    {sp: 440, ep: 445, t: 0, ac: 83},
    {sp: 446, ep: 452, t: 0, ac: 182},
    {sp: 453, ep: 458, t: 0, ac: 88},
    {sp: 458, ep: 467, t: 0, ac: 75},
    {sp: 467, ep: 476, t: 0, ac: 85},
    {sp: 477, ep: 482, t: 0, ac: 54},
    {sp: 483, ep: 489, t: 0, ac: 53},
    {sp: 489, ep: 495, t: 0, ac: 89},
    {sp: 496, ep: 498, t: 0, ac: 59},
    {sp: 499, ep: 502, t: 0, ac: 37},
    {sp: 502, ep: 506, t: 0, ac: 35},
    {sp: 507, ep: 510, t: 1, ac: 38},
    {sp: 511, ep: 515, t: 1, ac: 29},
    {sp: 515, ep: 517, t: 1, ac: 18},
    {sp: 518, ep: 520, t: 0, ac: 45},
    {sp: 520, ep: 523, t: 0, ac: 60},
    {sp: 523, ep: 525, t: 0, ac: 49},
    {sp: 526, ep: 528, t: 0, ac: 62},
    {sp: 528, ep: 531, t: 0, ac: 55},
    {sp: 531, ep: 534, t: 1, ac: 78},
    {sp: 534, ep: 537, t: 0, ac: 96},
    {sp: 537, ep: 541, t: 1, ac: 29},
    {sp: 542, ep: 545, t: 1, ac: 22},
    {sp: 545, ep: 548, t: 1, ac: 24},
    {sp: 549, ep: 551, t: 1, ac: 13},
    {sp: 551, ep: 552, t: 1, ac: 14},
    {sp: 553, ep: 554, t: 1, ac: 11},
    {sp: 554, ep: 555, t: 1, ac: 11},
    {sp: 556, ep: 557, t: 1, ac: 18},
    {sp: 558, ep: 559, t: 1, ac: 12},
    {sp: 560, ep: 561, t: 1, ac: 12},
    {sp: 562, ep: 564, t: 0, ac: 30},
    {sp: 564, ep: 566, t: 0, ac: 52},
    {sp: 566, ep: 568, t: 0, ac: 52},
    {sp: 568, ep: 570, t: 0, ac: 44},
    {sp: 570, ep: 571, t: 0, ac: 28},
    {sp: 572, ep: 573, t: 0, ac: 28},
    {sp: 574, ep: 575, t: 0, ac: 20},
    {sp: 575, ep: 577, t: 0, ac: 56},
    {sp: 577, ep: 578, t: 0, ac: 40},
    {sp: 578, ep: 580, t: 1, ac: 31},
    {sp: 580, ep: 581, t: 0, ac: 50},
    {sp: 582, ep: 583, t: 0, ac: 40},
    {sp: 583, ep: 584, t: 0, ac: 46},
    {sp: 585, ep: 585, t: 0, ac: 42},
    {sp: 586, ep: 586, t: 0, ac: 29},
    {sp: 587, ep: 587, t: 0, ac: 19},
    {sp: 587, ep: 589, t: 0, ac: 36},
    {sp: 589, ep: 589, t: 0, ac: 25},
    {sp: 590, ep: 590, t: 0, ac: 22},
    {sp: 591, ep: 591, t: 0, ac: 17},
    {sp: 591, ep: 592, t: 0, ac: 19},
    {sp: 592, ep: 592, t: 0, ac: 26},
    {sp: 593, ep: 594, t: 0, ac: 30},
    {sp: 594, ep: 594, t: 0, ac: 20},
    {sp: 595, ep: 595, t: 0, ac: 15},
    {sp: 595, ep: 596, t: 0, ac: 21},
    {sp: 596, ep: 596, t: 0, ac: 11},
    {sp: 596, ep: 596, t: 0, ac: 8},
    {sp: 597, ep: 597, t: 0, ac: 8},
    {sp: 597, ep: 597, t: 0, ac: 19},
    {sp: 598, ep: 598, t: 0, ac: 5},
    {sp: 598, ep: 599, t: 1, ac: 8},
    {sp: 599, ep: 599, t: 1, ac: 8},
    {sp: 599, ep: 600, t: 0, ac: 11},
    {sp: 600, ep: 600, t: 0, ac: 11},
    {sp: 600, ep: 600, t: 0, ac: 8},
    {sp: 601, ep: 601, t: 0, ac: 3},
    {sp: 601, ep: 601, t: 0, ac: 9},
    {sp: 601, ep: 601, t: 0, ac: 5},
    {sp: 602, ep: 602, t: 0, ac: 4},
    {sp: 602, ep: 602, t: 0, ac: 7},
    {sp: 602, ep: 602, t: 0, ac: 3},
    {sp: 603, ep: 603, t: 0, ac: 6},
    {sp: 603, ep: 603, t: 1, ac: 3},
    {sp: 603, ep: 603, t: 0, ac: 5},
    {sp: 604, ep: 604, t: 0, ac: 4},
    {sp: 604, ep: 604, t: 0, ac: 5},
    {sp: 604, ep: 604, t: 0, ac: 6},
  ],

  pageSuras: (pageIndex) => {
    if (pageIndex + 1 === QData.pagesInfo.length) {
      return [111, 112, 113];
    }
    let firstSura = QData.pagesInfo[pageIndex].s - 1;
    let suraList = [firstSura];
    let nextPageInfo = QData.pagesInfo[pageIndex + 1];
    let lastSura = nextPageInfo.s - (nextPageInfo.a === 1 ? 2 : 1);
    for (let s = firstSura + 1; s <= lastSura; s++) {
      suraList.push(s);
    }
    return suraList;
  },

  pagesInfo: [
    {s: 1, a: 1},
    {s: 2, a: 1},
    {s: 2, a: 6},
    {s: 2, a: 17},
    {s: 2, a: 25},
    {s: 2, a: 30},
    {s: 2, a: 38},
    {s: 2, a: 49},
    {s: 2, a: 58},
    {s: 2, a: 62},
    {s: 2, a: 70},
    {s: 2, a: 77},
    {s: 2, a: 84},
    {s: 2, a: 89},
    {s: 2, a: 94},
    {s: 2, a: 102},
    {s: 2, a: 106},
    {s: 2, a: 113},
    {s: 2, a: 120},
    {s: 2, a: 127},
    {s: 2, a: 135},
    {s: 2, a: 142},
    {s: 2, a: 146},
    {s: 2, a: 154},
    {s: 2, a: 164},
    {s: 2, a: 170},
    {s: 2, a: 177},
    {s: 2, a: 182},
    {s: 2, a: 187},
    {s: 2, a: 191},
    {s: 2, a: 197},
    {s: 2, a: 203},
    {s: 2, a: 211},
    {s: 2, a: 216},
    {s: 2, a: 220},
    {s: 2, a: 225},
    {s: 2, a: 231},
    {s: 2, a: 234},
    {s: 2, a: 238},
    {s: 2, a: 246},
    {s: 2, a: 249},
    {s: 2, a: 253},
    {s: 2, a: 257},
    {s: 2, a: 260},
    {s: 2, a: 265},
    {s: 2, a: 270},
    {s: 2, a: 275},
    {s: 2, a: 282},
    {s: 2, a: 283},
    {s: 3, a: 1},
    {s: 3, a: 10},
    {s: 3, a: 16},
    {s: 3, a: 23},
    {s: 3, a: 30},
    {s: 3, a: 38},
    {s: 3, a: 46},
    {s: 3, a: 53},
    {s: 3, a: 62},
    {s: 3, a: 71},
    {s: 3, a: 78},
    {s: 3, a: 84},
    {s: 3, a: 92},
    {s: 3, a: 101},
    {s: 3, a: 109},
    {s: 3, a: 116},
    {s: 3, a: 122},
    {s: 3, a: 133},
    {s: 3, a: 141},
    {s: 3, a: 149},
    {s: 3, a: 154},
    {s: 3, a: 158},
    {s: 3, a: 166},
    {s: 3, a: 174},
    {s: 3, a: 181},
    {s: 3, a: 187},
    {s: 3, a: 195},
    {s: 4, a: 1},
    {s: 4, a: 7},
    {s: 4, a: 12},
    {s: 4, a: 15},
    {s: 4, a: 20},
    {s: 4, a: 24},
    {s: 4, a: 27},
    {s: 4, a: 34},
    {s: 4, a: 38},
    {s: 4, a: 45},
    {s: 4, a: 52},
    {s: 4, a: 60},
    {s: 4, a: 66},
    {s: 4, a: 75},
    {s: 4, a: 80},
    {s: 4, a: 87},
    {s: 4, a: 92},
    {s: 4, a: 95},
    {s: 4, a: 102},
    {s: 4, a: 106},
    {s: 4, a: 114},
    {s: 4, a: 122},
    {s: 4, a: 128},
    {s: 4, a: 135},
    {s: 4, a: 141},
    {s: 4, a: 148},
    {s: 4, a: 155},
    {s: 4, a: 163},
    {s: 4, a: 171},
    {s: 4, a: 176},
    {s: 5, a: 3},
    {s: 5, a: 6},
    {s: 5, a: 10},
    {s: 5, a: 14},
    {s: 5, a: 18},
    {s: 5, a: 24},
    {s: 5, a: 32},
    {s: 5, a: 37},
    {s: 5, a: 42},
    {s: 5, a: 46},
    {s: 5, a: 51},
    {s: 5, a: 58},
    {s: 5, a: 65},
    {s: 5, a: 71},
    {s: 5, a: 77},
    {s: 5, a: 83},
    {s: 5, a: 90},
    {s: 5, a: 96},
    {s: 5, a: 104},
    {s: 5, a: 109},
    {s: 5, a: 114},
    {s: 6, a: 1},
    {s: 6, a: 9},
    {s: 6, a: 19},
    {s: 6, a: 28},
    {s: 6, a: 36},
    {s: 6, a: 45},
    {s: 6, a: 53},
    {s: 6, a: 60},
    {s: 6, a: 69},
    {s: 6, a: 74},
    {s: 6, a: 82},
    {s: 6, a: 91},
    {s: 6, a: 95},
    {s: 6, a: 102},
    {s: 6, a: 111},
    {s: 6, a: 119},
    {s: 6, a: 125},
    {s: 6, a: 132},
    {s: 6, a: 138},
    {s: 6, a: 143},
    {s: 6, a: 147},
    {s: 6, a: 152},
    {s: 6, a: 158},
    {s: 7, a: 1},
    {s: 7, a: 12},
    {s: 7, a: 23},
    {s: 7, a: 31},
    {s: 7, a: 38},
    {s: 7, a: 44},
    {s: 7, a: 52},
    {s: 7, a: 58},
    {s: 7, a: 68},
    {s: 7, a: 74},
    {s: 7, a: 82},
    {s: 7, a: 88},
    {s: 7, a: 96},
    {s: 7, a: 105},
    {s: 7, a: 121},
    {s: 7, a: 131},
    {s: 7, a: 138},
    {s: 7, a: 144},
    {s: 7, a: 150},
    {s: 7, a: 156},
    {s: 7, a: 160},
    {s: 7, a: 164},
    {s: 7, a: 171},
    {s: 7, a: 179},
    {s: 7, a: 188},
    {s: 7, a: 196},
    {s: 8, a: 1},
    {s: 8, a: 9},
    {s: 8, a: 17},
    {s: 8, a: 26},
    {s: 8, a: 34},
    {s: 8, a: 41},
    {s: 8, a: 46},
    {s: 8, a: 53},
    {s: 8, a: 62},
    {s: 8, a: 70},
    {s: 9, a: 1},
    {s: 9, a: 7},
    {s: 9, a: 14},
    {s: 9, a: 21},
    {s: 9, a: 27},
    {s: 9, a: 32},
    {s: 9, a: 37},
    {s: 9, a: 41},
    {s: 9, a: 48},
    {s: 9, a: 55},
    {s: 9, a: 62},
    {s: 9, a: 69},
    {s: 9, a: 73},
    {s: 9, a: 80},
    {s: 9, a: 87},
    {s: 9, a: 94},
    {s: 9, a: 100},
    {s: 9, a: 107},
    {s: 9, a: 112},
    {s: 9, a: 118},
    {s: 9, a: 123},
    {s: 10, a: 1},
    {s: 10, a: 7},
    {s: 10, a: 15},
    {s: 10, a: 21},
    {s: 10, a: 26},
    {s: 10, a: 34},
    {s: 10, a: 43},
    {s: 10, a: 54},
    {s: 10, a: 62},
    {s: 10, a: 71},
    {s: 10, a: 79},
    {s: 10, a: 89},
    {s: 10, a: 98},
    {s: 10, a: 107},
    {s: 11, a: 6},
    {s: 11, a: 13},
    {s: 11, a: 20},
    {s: 11, a: 29},
    {s: 11, a: 38},
    {s: 11, a: 46},
    {s: 11, a: 54},
    {s: 11, a: 63},
    {s: 11, a: 72},
    {s: 11, a: 82},
    {s: 11, a: 89},
    {s: 11, a: 98},
    {s: 11, a: 109},
    {s: 11, a: 118},
    {s: 12, a: 5},
    {s: 12, a: 15},
    {s: 12, a: 23},
    {s: 12, a: 31},
    {s: 12, a: 38},
    {s: 12, a: 44},
    {s: 12, a: 53},
    {s: 12, a: 64},
    {s: 12, a: 70},
    {s: 12, a: 79},
    {s: 12, a: 87},
    {s: 12, a: 96},
    {s: 12, a: 104},
    {s: 13, a: 1},
    {s: 13, a: 6},
    {s: 13, a: 14},
    {s: 13, a: 19},
    {s: 13, a: 29},
    {s: 13, a: 35},
    {s: 13, a: 43},
    {s: 14, a: 6},
    {s: 14, a: 11},
    {s: 14, a: 19},
    {s: 14, a: 25},
    {s: 14, a: 34},
    {s: 14, a: 43},
    {s: 15, a: 1},
    {s: 15, a: 16},
    {s: 15, a: 32},
    {s: 15, a: 52},
    {s: 15, a: 71},
    {s: 15, a: 91},
    {s: 16, a: 7},
    {s: 16, a: 15},
    {s: 16, a: 27},
    {s: 16, a: 35},
    {s: 16, a: 43},
    {s: 16, a: 55},
    {s: 16, a: 65},
    {s: 16, a: 73},
    {s: 16, a: 80},
    {s: 16, a: 88},
    {s: 16, a: 94},
    {s: 16, a: 103},
    {s: 16, a: 111},
    {s: 16, a: 119},
    {s: 17, a: 1},
    {s: 17, a: 8},
    {s: 17, a: 18},
    {s: 17, a: 28},
    {s: 17, a: 39},
    {s: 17, a: 50},
    {s: 17, a: 59},
    {s: 17, a: 67},
    {s: 17, a: 76},
    {s: 17, a: 87},
    {s: 17, a: 97},
    {s: 17, a: 105},
    {s: 18, a: 5},
    {s: 18, a: 16},
    {s: 18, a: 21},
    {s: 18, a: 28},
    {s: 18, a: 35},
    {s: 18, a: 46},
    {s: 18, a: 54},
    {s: 18, a: 62},
    {s: 18, a: 75},
    {s: 18, a: 84},
    {s: 18, a: 98},
    {s: 19, a: 1},
    {s: 19, a: 12},
    {s: 19, a: 26},
    {s: 19, a: 39},
    {s: 19, a: 52},
    {s: 19, a: 65},
    {s: 19, a: 77},
    {s: 19, a: 96},
    {s: 20, a: 13},
    {s: 20, a: 38},
    {s: 20, a: 52},
    {s: 20, a: 65},
    {s: 20, a: 77},
    {s: 20, a: 88},
    {s: 20, a: 99},
    {s: 20, a: 114},
    {s: 20, a: 126},
    {s: 21, a: 1},
    {s: 21, a: 11},
    {s: 21, a: 25},
    {s: 21, a: 36},
    {s: 21, a: 45},
    {s: 21, a: 58},
    {s: 21, a: 73},
    {s: 21, a: 82},
    {s: 21, a: 91},
    {s: 21, a: 102},
    {s: 22, a: 1},
    {s: 22, a: 6},
    {s: 22, a: 16},
    {s: 22, a: 24},
    {s: 22, a: 31},
    {s: 22, a: 39},
    {s: 22, a: 47},
    {s: 22, a: 56},
    {s: 22, a: 65},
    {s: 22, a: 73},
    {s: 23, a: 1},
    {s: 23, a: 18},
    {s: 23, a: 28},
    {s: 23, a: 43},
    {s: 23, a: 60},
    {s: 23, a: 75},
    {s: 23, a: 90},
    {s: 23, a: 105},
    {s: 24, a: 1},
    {s: 24, a: 11},
    {s: 24, a: 21},
    {s: 24, a: 28},
    {s: 24, a: 32},
    {s: 24, a: 37},
    {s: 24, a: 44},
    {s: 24, a: 54},
    {s: 24, a: 59},
    {s: 24, a: 62},
    {s: 25, a: 3},
    {s: 25, a: 12},
    {s: 25, a: 21},
    {s: 25, a: 33},
    {s: 25, a: 44},
    {s: 25, a: 56},
    {s: 25, a: 68},
    {s: 26, a: 1},
    {s: 26, a: 20},
    {s: 26, a: 40},
    {s: 26, a: 61},
    {s: 26, a: 84},
    {s: 26, a: 112},
    {s: 26, a: 137},
    {s: 26, a: 160},
    {s: 26, a: 184},
    {s: 26, a: 207},
    {s: 27, a: 1},
    {s: 27, a: 14},
    {s: 27, a: 23},
    {s: 27, a: 36},
    {s: 27, a: 45},
    {s: 27, a: 56},
    {s: 27, a: 64},
    {s: 27, a: 77},
    {s: 27, a: 89},
    {s: 28, a: 6},
    {s: 28, a: 14},
    {s: 28, a: 22},
    {s: 28, a: 29},
    {s: 28, a: 36},
    {s: 28, a: 44},
    {s: 28, a: 51},
    {s: 28, a: 60},
    {s: 28, a: 71},
    {s: 28, a: 78},
    {s: 28, a: 85},
    {s: 29, a: 7},
    {s: 29, a: 15},
    {s: 29, a: 24},
    {s: 29, a: 31},
    {s: 29, a: 39},
    {s: 29, a: 46},
    {s: 29, a: 53},
    {s: 29, a: 64},
    {s: 30, a: 6},
    {s: 30, a: 16},
    {s: 30, a: 25},
    {s: 30, a: 33},
    {s: 30, a: 42},
    {s: 30, a: 51},
    {s: 31, a: 1},
    {s: 31, a: 12},
    {s: 31, a: 20},
    {s: 31, a: 29},
    {s: 32, a: 1},
    {s: 32, a: 12},
    {s: 32, a: 21},
    {s: 33, a: 1},
    {s: 33, a: 7},
    {s: 33, a: 16},
    {s: 33, a: 23},
    {s: 33, a: 31},
    {s: 33, a: 36},
    {s: 33, a: 44},
    {s: 33, a: 51},
    {s: 33, a: 55},
    {s: 33, a: 63},
    {s: 34, a: 1},
    {s: 34, a: 8},
    {s: 34, a: 15},
    {s: 34, a: 23},
    {s: 34, a: 32},
    {s: 34, a: 40},
    {s: 34, a: 49},
    {s: 35, a: 4},
    {s: 35, a: 12},
    {s: 35, a: 19},
    {s: 35, a: 31},
    {s: 35, a: 39},
    {s: 35, a: 45},
    {s: 36, a: 13},
    {s: 36, a: 28},
    {s: 36, a: 41},
    {s: 36, a: 55},
    {s: 36, a: 71},
    {s: 37, a: 1},
    {s: 37, a: 25},
    {s: 37, a: 52},
    {s: 37, a: 77},
    {s: 37, a: 103},
    {s: 37, a: 127},
    {s: 37, a: 154},
    {s: 38, a: 1},
    {s: 38, a: 17},
    {s: 38, a: 27},
    {s: 38, a: 43},
    {s: 38, a: 62},
    {s: 38, a: 84},
    {s: 39, a: 6},
    {s: 39, a: 11},
    {s: 39, a: 22},
    {s: 39, a: 32},
    {s: 39, a: 41},
    {s: 39, a: 48},
    {s: 39, a: 57},
    {s: 39, a: 68},
    {s: 39, a: 75},
    {s: 40, a: 8},
    {s: 40, a: 17},
    {s: 40, a: 26},
    {s: 40, a: 34},
    {s: 40, a: 41},
    {s: 40, a: 50},
    {s: 40, a: 59},
    {s: 40, a: 67},
    {s: 40, a: 78},
    {s: 41, a: 1},
    {s: 41, a: 12},
    {s: 41, a: 21},
    {s: 41, a: 30},
    {s: 41, a: 39},
    {s: 41, a: 47},
    {s: 42, a: 1},
    {s: 42, a: 11},
    {s: 42, a: 16},
    {s: 42, a: 23},
    {s: 42, a: 32},
    {s: 42, a: 45},
    {s: 42, a: 52},
    {s: 43, a: 11},
    {s: 43, a: 23},
    {s: 43, a: 34},
    {s: 43, a: 48},
    {s: 43, a: 61},
    {s: 43, a: 74},
    {s: 44, a: 1},
    {s: 44, a: 19},
    {s: 44, a: 40},
    {s: 45, a: 1},
    {s: 45, a: 14},
    {s: 45, a: 23},
    {s: 45, a: 33},
    {s: 46, a: 6},
    {s: 46, a: 15},
    {s: 46, a: 21},
    {s: 46, a: 29},
    {s: 47, a: 1},
    {s: 47, a: 12},
    {s: 47, a: 20},
    {s: 47, a: 30},
    {s: 48, a: 1},
    {s: 48, a: 10},
    {s: 48, a: 16},
    {s: 48, a: 24},
    {s: 48, a: 29},
    {s: 49, a: 5},
    {s: 49, a: 12},
    {s: 50, a: 1},
    {s: 50, a: 16},
    {s: 50, a: 36},
    {s: 51, a: 7},
    {s: 51, a: 31},
    {s: 51, a: 52},
    {s: 52, a: 15},
    {s: 52, a: 32},
    {s: 53, a: 1},
    {s: 53, a: 27},
    {s: 53, a: 45},
    {s: 54, a: 7},
    {s: 54, a: 28},
    {s: 54, a: 50},
    {s: 55, a: 17},
    {s: 55, a: 41},
    {s: 55, a: 68},
    {s: 56, a: 17},
    {s: 56, a: 51},
    {s: 56, a: 77},
    {s: 57, a: 4},
    {s: 57, a: 12},
    {s: 57, a: 19},
    {s: 57, a: 25},
    {s: 58, a: 1},
    {s: 58, a: 7},
    {s: 58, a: 12},
    {s: 58, a: 22},
    {s: 59, a: 4},
    {s: 59, a: 10},
    {s: 59, a: 17},
    {s: 60, a: 1},
    {s: 60, a: 6},
    {s: 60, a: 12},
    {s: 61, a: 6},
    {s: 62, a: 1},
    {s: 62, a: 9},
    {s: 63, a: 5},
    {s: 64, a: 1},
    {s: 64, a: 10},
    {s: 65, a: 1},
    {s: 65, a: 6},
    {s: 66, a: 1},
    {s: 66, a: 8},
    {s: 67, a: 1},
    {s: 67, a: 13},
    {s: 67, a: 27},
    {s: 68, a: 16},
    {s: 68, a: 43},
    {s: 69, a: 9},
    {s: 69, a: 35},
    {s: 70, a: 11},
    {s: 70, a: 40},
    {s: 71, a: 11},
    {s: 72, a: 1},
    {s: 72, a: 14},
    {s: 73, a: 1},
    {s: 73, a: 20},
    {s: 74, a: 18},
    {s: 74, a: 48},
    {s: 75, a: 20},
    {s: 76, a: 6},
    {s: 76, a: 26},
    {s: 77, a: 20},
    {s: 78, a: 1},
    {s: 78, a: 31},
    {s: 79, a: 16},
    {s: 80, a: 1},
    {s: 81, a: 1},
    {s: 82, a: 1},
    {s: 83, a: 7},
    {s: 83, a: 35},
    {s: 85, a: 1},
    {s: 86, a: 1},
    {s: 87, a: 16},
    {s: 89, a: 1},
    {s: 89, a: 24},
    {s: 91, a: 1},
    {s: 92, a: 15},
    {s: 95, a: 1},
    {s: 97, a: 1},
    {s: 98, a: 8},
    {s: 100, a: 10},
    {s: 103, a: 1},
    {s: 106, a: 1},
    {s: 109, a: 1},
    {s: 112, a: 1},
  ],
};

export default QData;
export const ayatCount = 6236;
export const surahCount = 114;