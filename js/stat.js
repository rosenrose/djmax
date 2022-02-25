let commonHeads = ["전체", "4B", "5B", "6B", "8B"];
let ranks = ["NM", "HD", "MX", "SC"];
let tableHeads = {
  levelAvg: [...commonHeads, "카테고리"],
  minLevel: [...commonHeads, "카테고리"],
  maxLevel: [...commonHeads, "카테고리"],
  levels: ["버튼", "레벨", "카테고리"],
  levelHistogram: commonHeads,
  patternCount: [...commonHeads, "SC", "카테고리", "SC 비율"],
  patternCountAvg: [...commonHeads, "SC"],
  patternCountHistogram: ["전체"],
  length: ["길이", "카테고리"],
  bpm: ["BPM", "카테고리"],
  date: ["수록 날짜", "카테고리"],
  noteAvg: [...commonHeads, "카테고리"],
  notes: ["버튼", "노트 수", "카테고리"],
  noteDensity: ["버튼", "노트 밀도(개수/초)", "카테고리"],
  noteHistogram: commonHeads,
};
const MIN_LEVEL = 1;
const MAX_LEVEL = 15;
const ASC = "▲";
const DES = "▼";
let [songs, categoryList, categoryData, levelCountList, patternCountList, noteCountList, levelNoteList] = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
];
let [
  list,
  totalLevelSum,
  totalPatternCount,
  totalLevelAvg,
  totalMinLevelAvg,
  totalMaxLevelAvg,
  totalNoteSum,
  totalNoteCount,
  totalNoteAvg,
] = [{}, {}, {}, {}, {}, {}, {}, {}, {}];
let [totalLengthSum, totalLengthAvg, totalBpmMin, totalBpmMid, totalBpmMax] = [0, 0, 0, 0, 0];
let timeStart; //시간 측정할 때
let dateFormat = new Intl.DateTimeFormat("ko", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function App() {
  React.useEffect(() => {
    fetch("../list.json")
      .then((response) => response.json())
      .then((json) => {
        list = json;
        for (let category in list["songs"]) {
          list["songs"][category] = list["songs"][category].map((song) => new Song(song, true));
        }
        categoryList = Object.keys(list["songs"]); //인덱스 비교용

        commonHeads.forEach((head) => {
          totalLevelSum[head] =
            totalPatternCount[head] =
            totalLevelAvg[head] =
            totalMinLevelAvg[head] =
            totalMaxLevelAvg[head] =
            totalNoteSum[head] =
            totalNoteCount[head] =
            totalNoteAvg[head] =
              0;
        });
        totalPatternCount["SC"] = 0;

        for (let i = MIN_LEVEL; i <= MAX_LEVEL; i++) {
          levelCountList.push({ level: i });
          commonHeads.forEach((head) => {
            levelCountList[i - 1][head] = 0;
          });
        }

        for (let category in list["songs"]) {
          let catDat = {
            category: category,
            levelSum: {},
            patternCount: {},
            levelAvg: {},
            noteSum: {},
            noteAvg: {},
          };

          commonHeads.forEach((head) => {
            catDat["levelSum"][head] =
              catDat["patternCount"][head] =
              catDat["levelAvg"][head] =
              catDat["noteSum"][head] =
              catDat["noteAvg"][head] =
                0;
          });
          catDat["patternCount"]["SC"] = 0;

          for (let song of list["songs"][category]) {
            song["category"] = category;

            totalLengthSum += song["length"];
            totalBpmMin += bpmToNumber(song["bpm"], "min");
            totalBpmMid += bpmToNumber(song["bpm"], "mid");
            totalBpmMax += bpmToNumber(song["bpm"], "max");

            for (let btn in song["level"]) {
              for (let rank in song["level"][btn]) {
                levelNoteList.push({
                  title: song["uniqueTitle"],
                  btn,
                  rank,
                  level: song["level"][btn][rank],
                  note: song["note"][btn][rank],
                  noteDensity: song["noteDensity"][btn][rank],
                  category,
                });
                if (song["note"][btn][rank] > 0) {
                  totalNoteCount[btn] += 1;
                  totalNoteCount["전체"] += 1;
                }
              }
            }

            commonHeads.forEach((head) => {
              totalMinLevelAvg[head] += song["minLevel"][head];
              totalMaxLevelAvg[head] += song["maxLevel"][head];
              catDat["levelSum"][head] += song["levelSum"][head];
              catDat["patternCount"][head] += song["patternCount"][head];
              catDat["noteSum"][head] += song["noteSum"][head];
            });
            catDat["patternCount"]["SC"] += song["patternCount"]["SC"];

            for (let level in song["levelCount"]) {
              for (let btn in song["levelCount"][level]) {
                let count = song["levelCount"][level][btn];
                levelCountList[level - 1][btn] += count;
              }
            }

            if (!patternCountList.find((pc) => pc["patternCount"] == song["patternCount"]["전체"])) {
              patternCountList.push({
                patternCount: song["patternCount"]["전체"],
                전체: 0,
              });
            }
            patternCountList.find((pc) => pc["patternCount"] == song["patternCount"]["전체"])["전체"] += 1;

            for (let noteCountKey in song["noteCount"]) {
              for (let btn in song["noteCount"][noteCountKey]) {
                let count = song["noteCount"][noteCountKey][btn];
                if (!noteCountList.find((nc) => nc["note"] == noteCountKey)) {
                  noteCountList.push({
                    note: noteCountKey,
                    전체: 0,
                    "4B": 0,
                    "5B": 0,
                    "6B": 0,
                    "8B": 0,
                  });
                }
                noteCountList.find((nc) => nc["note"] == noteCountKey)[btn] += count;
              }
            }

            songs.push(song);
          }

          commonHeads.forEach((head) => {
            totalLevelSum[head] += catDat["levelSum"][head];
            totalNoteSum[head] += catDat["noteSum"][head];
            totalPatternCount[head] += catDat["patternCount"][head];
            catDat["levelAvg"][head] = catDat["levelSum"][head] / catDat["patternCount"][head];
            catDat["noteAvg"][head] = catDat["noteSum"][head] / catDat["patternCount"][head];
          });
          totalPatternCount["SC"] += catDat["patternCount"]["SC"];
          catDat["SC 비율"] = (catDat["patternCount"]["SC"] / catDat["patternCount"]["전체"]) * 100;
          catDat["songCount"] = list["songs"][category].length;

          categoryData.push(catDat);
        }

        commonHeads.forEach((head) => {
          totalLevelAvg[head] = totalLevelSum[head] / totalPatternCount[head];
          totalNoteAvg[head] = totalNoteSum[head] / totalNoteCount[head];
          totalMinLevelAvg[head] = totalMinLevelAvg[head] / songs.length;
          totalMaxLevelAvg[head] = totalMaxLevelAvg[head] / songs.length;
        });
        totalLengthAvg = Math.round(totalLengthSum / songs.length);

        patternCountList.sort((a, b) => a["patternCount"] - b["patternCount"]);

        noteCountList = noteCountList
          .filter((nc) => nc["note"] != "0")
          .sort((a, b) => parseInt(a["note"].split(" ~ ")[0]) - parseInt(b["note"].split(" ~ ")[0]));

        categoryData.forEach((catDat) => {
          catDat["patternCountAvg"] = {};
          tableHeads["patternCountAvg"].forEach((head) => {
            catDat["patternCountAvg"][head] = catDat["patternCount"][head] / catDat["songCount"];
          });
        });

        setLoading(false);
      });
  }, []);

  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState("levelAvg");
  const [titleMode, setTitleMode] = React.useState("title");
  const [bpmMode, setBpmMode] = React.useState("min");
  const [dateMode, setDateMode] = React.useState("early");
  const [isLevelsNotesSort, setIsLevelsNotesSort] = React.useState(false);
  const [btnSelect, setBtnSelect] = React.useState(new Set(["4B"]));
  const [rankSelect, setRankSelect] = React.useState(new Set(["NM", "HD", "MX", "SC"]));
  const [sort, setSort] = React.useState();

  const onModeChange = (event) => {
    setMode(event.target.value);
  };
  const onTitleChange = (event) => {
    setTitleMode(event.target.value);
  };
  const onBpmChange = (event) => {
    setBpmMode(event.target.value);

    let th = event.target.closest("th");
    if (th.dataset.sorted) {
      sortTitle({
        mode,
        order: th.dataset.sorted,
        bpmMode: event.target.value,
      });
      setSort((cur) => (cur == ASC ? DES : ASC));
    }
  };
  const onDateChange = (event) => {
    setDateMode(event.target.value);

    let th = event.target.closest("th");
    if (th.dataset.sorted) {
      sortTitle({
        mode,
        order: th.dataset.sorted,
        dateMode: event.target.value,
      });
      setSort((cur) => (cur == ASC ? DES : ASC));
    }
  };

  const onIsLevelsNotesSort = (event) => {
    setIsLevelsNotesSort(event.target.checked);
  };
  const onBtnSelectChange = (event) => {
    let btn = event.target.value;
    let th = event.target.closest("th");

    if (event.target.checked) {
      th.className = `${btn}-background btn-rank`;
      btnSelect.add(event.target.value);
    } else {
      th.className = `${btn}-color`;
      btnSelect.delete(event.target.value);
    }
    document.querySelector("th[data-sorted]")?.removeAttribute("data-sorted");
  };
  const onRankSelectChange = (event) => {
    let rank = event.target.value;
    let th = event.target.closest("th");

    if (event.target.checked) {
      th.className = `${rank}-background btn-rank`;
      rankSelect.add(event.target.value);
    } else {
      th.className = `${rank}-color`;
      rankSelect.delete(event.target.value);
    }
    document.querySelector("th[data-sorted]")?.removeAttribute("data-sorted");
  };
  const onThClick = (event) => {
    sortTable({
      target: event.target,
      mode,
      titleMode,
      bpmMode,
      dateMode,
      isLevelsNotesSort,
      setSort,
    });
  };

  return (
    <>
      <Select onChange={onModeChange} />
      {loading ? (
        <h1>로딩...</h1>
      ) : (
        <>
          <table id="stat">
            <Thead
              mode={mode}
              titleMode={titleMode}
              bpmMode={bpmMode}
              dateMode={dateMode}
              isLevelsNotesSort={isLevelsNotesSort}
              btnSelect={btnSelect}
              rankSelect={rankSelect}
              onTitleChange={onTitleChange}
              onBpmChange={onBpmChange}
              onDateChange={onDateChange}
              onIsLevelsNotesSort={onIsLevelsNotesSort}
              onBtnSelectChange={onBtnSelectChange}
              onRankSelectChange={onRankSelectChange}
              onThClick={onThClick}
            />
            <Tbody
              mode={mode}
              titleMode={titleMode}
              bpmMode={bpmMode}
              dateMode={dateMode}
              isLevelsNotesSort={isLevelsNotesSort}
              btnSelect={btnSelect}
              rankSelect={rankSelect}
            />
            <Tfoot mode={mode} titleMode={titleMode} bpmMode={bpmMode} />
          </table>
          {((["levelAvg", "patternCount", "noteAvg"].includes(mode) && titleMode == "category") ||
            mode == "patternCountAvg" ||
            mode.includes("Histogram") ||
            (mode == "levelAvg" && titleMode == "title")) && (
            <Graph mode={mode} tbodyMode={getTbodyMode(mode, titleMode, isLevelsNotesSort)} />
          )}
        </>
      )}
    </>
  );
}

function Select({ onChange }) {
  return (
    <div id="selectMode" onChange={onChange}>
      <div>
        <label>
          <input type="radio" name="mode" value="levelAvg" defaultChecked />
          레벨 평균
        </label>
        <label>
          <input type="radio" name="mode" value="minLevel" />
          최소 레벨
        </label>
        <label>
          <input type="radio" name="mode" value="maxLevel" />
          최대 레벨
        </label>
        <label>
          <input type="radio" name="mode" value="levels" />
          레벨 목록
        </label>
        <label>
          <input type="radio" name="mode" value="levelHistogram" />
          레벨 분포
        </label>
      </div>
      <div>
        <label>
          <input type="radio" name="mode" value="patternCount" />
          패턴 개수
        </label>
        <label>
          <input type="radio" name="mode" value="patternCountAvg" />
          패턴 개수 평균
        </label>
        <label>
          <input type="radio" name="mode" value="patternCountHistogram" />
          패턴 개수 분포
        </label>
      </div>
      <div>
        <label>
          <input type="radio" name="mode" value="length" />곡 길이
        </label>
        <label>
          <input type="radio" name="mode" value="bpm" />
          BPM
        </label>
        <label>
          <input type="radio" name="mode" value="date" />
          수록 날짜
        </label>
      </div>
      <div>
        <label>
          <input type="radio" name="mode" value="noteAvg" />
          노트 수 평균
        </label>
        <label>
          <input type="radio" name="mode" value="notes" />
          노트 수 목록
        </label>
        <label>
          <input type="radio" name="mode" value="noteDensity" />
          노트 밀도
        </label>
        <label>
          <input type="radio" name="mode" value="noteHistogram" />
          노트 수 분포
        </label>
      </div>
    </div>
  );
}

function Thead({
  mode,
  titleMode,
  bpmMode,
  dateMode,
  isLevelsNotesSort,
  btnSelect,
  rankSelect,
  onTitleChange,
  onBpmChange,
  onDateChange,
  onIsLevelsNotesSort,
  onBtnSelectChange,
  onRankSelectChange,
  onThClick,
}) {
  React.useEffect(() => {
    document.querySelectorAll("th[data-sorted]").forEach((th) => th.removeAttribute("data-sorted"));
  }, [mode, titleMode]);

  React.useEffect(() => {
    if (!isLevelsNotesSort) {
      document.querySelectorAll("tr.rankSelect th").forEach((th) => {
        let rank = th.querySelector("label").lastChild.textContent;
        th.className = `${rank}-background btn-rank`;
      });
    }
  }, [isLevelsNotesSort]);

  let isSeperator = ["levelAvg", "patternCount", "noteAvg"].includes(mode);
  let titleLabel = (
    <label id="titleLabel" className="click inline">
      {isSeperator && <input type="radio" name="titleMode" value="title" defaultChecked={titleMode == "title"} />}
      제목<span className="sortArrow">{ASC}</span>
    </label>
  );
  let seperator = <span> / </span>;
  let categoryLabel = (
    <label className="click inline categorySort">
      {isSeperator && <input type="radio" name="titleMode" value="category" defaultChecked={titleMode == "category"} />}
      카테고리<span className="sortArrow">{ASC}</span>
    </label>
  );

  let leftTopTh;

  switch (mode) {
    case "levelHistogram":
      leftTopTh = (
        <th className="click">
          레벨<span className="sortArrow">{ASC}</span>
        </th>
      );
      break;
    case "patternCountHistogram":
      leftTopTh = (
        <th className="click">
          패턴 개수<span className="sortArrow">{ASC}</span>
        </th>
      );
      break;
    case "noteHistogram":
      leftTopTh = (
        <th className="click">
          노트 수<span className="sortArrow">{ASC}</span>
        </th>
      );
      break;
    default:
      leftTopTh = (
        <th onChange={onTitleChange} rowSpan={["levels", "notes", "noteDensity"].includes(mode) ? 3 : 1}>
          {mode != "patternCountAvg" && titleLabel}
          {isSeperator && seperator}
          {["levelAvg", "patternCount", "patternCountAvg", "noteAvg"].includes(mode) && categoryLabel}
        </th>
      );
      break;
  }

  let ths = [];
  let tbodyMode = getTbodyMode(mode, titleMode, isLevelsNotesSort);

  for (let head of tableHeads[mode]) {
    if ((tbodyMode == "title" && head == "SC 비율") || (tbodyMode == "category" && head == "카테고리")) {
      continue;
    }

    let classList = new Set();
    let isSortClick =
      !["levels", "notes", "noteDensity"].includes(mode) ||
      (["levels", "notes", "noteDensity"].includes(mode) &&
        (head == "카테고리" || (["레벨", "노트 수", "노트 밀도(개수/초)"].includes(head) && isLevelsNotesSort)));

    if (isSortClick) {
      classList.add("click");
    }
    if (head == "카테고리") {
      classList.add("categorySort");
    }
    if ([...commonHeads, "SC"].includes(head)) {
      classList.add(`${head}-background btn-rank`);
    }

    let id = "";
    if ((mode == "length" && head == "길이") || (mode == "date" && head == "수록 날짜")) {
      id = mode;
    }

    ths.push(
      <th
        key={head}
        className={[...classList].join(" ")}
        id={id}
        rowSpan={["levels", "notes", "noteDensity"].includes(mode) && ["버튼", "카테고리"].includes(head) ? 3 : 1}
        colSpan={
          ["levels", "notes", "noteDensity"].includes(mode) && ["레벨", "노트 수", "노트 밀도(개수/초)"].includes(head)
            ? 4
            : 1
        }
      >
        {head}
        {isSortClick && <span className="sortArrow">{ASC}</span>}
        {mode == "bpm" && head == "BPM" && (
          <div className="subSelectMode" onChange={onBpmChange}>
            <label>
              <input type="radio" name="bpmMode" value="min" defaultChecked={bpmMode == "min"} />
              최솟값
            </label>
            <label>
              <input type="radio" name="bpmMode" value="mid" defaultChecked={bpmMode == "mid"} />
              중간값
            </label>
            <label>
              <input type="radio" name="bpmMode" value="max" defaultChecked={bpmMode == "max"} />
              최댓값
            </label>
          </div>
        )}
        {mode == "date" && head == "수록 날짜" && (
          <div className="subSelectMode" onChange={onDateChange}>
            <label>
              <input type="radio" name="dateMode" value="early" defaultChecked={dateMode == "early"} />
              빠른 날짜
            </label>
            <label>
              <input type="radio" name="dateMode" value="PS4" defaultChecked={dateMode == "PS4"} />
              PS4
            </label>
            <label>
              <input type="radio" name="dateMode" value="PC" defaultChecked={dateMode == "PC"} />
              PC
            </label>
          </div>
        )}
        {["levels", "notes", "noteDensity"].includes(mode) && ["레벨", "노트 수", "노트 밀도(개수/초)"].includes(head) && (
          <label id="levelsNotesSort" onChange={onIsLevelsNotesSort}>
            <input type="checkbox" defaultChecked={isLevelsNotesSort} />
            정렬
          </label>
        )}
      </th>
    );
  }

  return (
    <thead>
      <tr onClick={onThClick}>
        {leftTopTh}
        {ths}
      </tr>
      {["levels", "notes", "noteDensity"].includes(mode) && isLevelsNotesSort && (
        <tr className="subSelectMode btnSelect" onChange={onBtnSelectChange}>
          {commonHeads.slice(1).map((btn) => (
            <th key={btn} className={btnSelect.has(btn) ? `${btn}-background btn-rank` : `${btn}-color`}>
              <label>
                {isLevelsNotesSort && (
                  <input type="checkbox" value={btn} defaultChecked={btnSelect.has(btn)} className="block" />
                )}
                {btn}
              </label>
            </th>
          ))}
        </tr>
      )}
      {["levels", "notes", "noteDensity"].includes(mode) && (
        <tr className="subSelectMode rankSelect" onChange={onRankSelectChange}>
          {ranks.map((rank) => (
            <th
              key={rank}
              className={!isLevelsNotesSort || rankSelect.has(rank) ? `${rank}-background btn-rank` : `${rank}-color`}
            >
              <label>
                {isLevelsNotesSort && (
                  <input type="checkbox" value={rank} defaultChecked={rankSelect.has(rank)} className="block" />
                )}
                {rank}
              </label>
            </th>
          ))}
        </tr>
      )}
    </thead>
  );
}

function Tbody({ mode, titleMode, bpmMode, dateMode, isLevelsNotesSort, btnSelect, rankSelect }) {
  let trs;

  switch (getTbodyMode(mode, titleMode, isLevelsNotesSort)) {
    case "title":
      trs = <Title mode={mode} bpmMode={bpmMode} dateMode={dateMode} />;
      break;
    case "category":
      trs = <Category mode={mode} />;
      break;
    case "histogram":
      trs = <Histogram mode={mode} />;
      break;
    case "levelsNotesSort":
      trs = <LevelsNotesSort mode={mode} btnSelect={btnSelect} rankSelect={rankSelect} />;
      break;
  }

  return <tbody>{trs}</tbody>;
}

function Title({ mode, bpmMode, dateMode }) {
  let trs = [];
  let filteredSongs;

  if (mode == "length") {
    filteredSongs = songs.filter((song) => song["length"] > 0);
  } else if (mode == "date" && dateMode != "early") {
    filteredSongs = songs.filter((song) => song["date"][dateMode] > 0);
  } else if (["noteAvg", "notes", "noteDensity"].includes(mode)) {
    filteredSongs = songs.filter((song) => Object.values(song["noteSum"]).every((noteSum) => noteSum > 0));
  }

  (filteredSongs || songs).forEach((song) => {
    let tds = [];
    let category = song["category"];

    if (!["levels", "notes", "noteDensity"].includes(mode)) {
      (mode == "patternCount" ? tableHeads[mode].slice(0, -1) : tableHeads[mode]).forEach((head) => {
        let data;

        if (head == "카테고리") {
          data = list["dlcKor"][song["category"]];
        } else {
          switch (mode) {
            case "levelAvg":
              data = song["levelAvg"][head].toFixed(2);
              break;
            case "minLevel":
              data = song["minLevel"][head];
              break;
            case "maxLevel":
              data = song["maxLevel"][head];
              break;
            case "patternCount":
              data = song["patternCount"][head];
              break;
            case "length":
              data = `${Math.floor(song["length"] / 60)}분 ${song["length"] % 60}초`;
              break;
            case "bpm":
              data = song["bpm"];
              break;
            case "date":
              data = dateFormat.format(song["date"][dateMode]);
              break;
            case "noteAvg":
              data = song["noteAvg"][head].toFixed(1);
              break;
          }
        }

        tds.push(
          <td
            key={head}
            style={mode == "date" && head == "카테고리" ? getCategoryStyle(category, list["collaboration"]) : null}
          >
            {data}
            {mode == "bpm" && head == "BPM" && bpmMode == "mid" && isNaN(song["bpm"]) && (
              <span className="mid">{`(${bpmToNumber(song["bpm"], "mid")})`}</span>
            )}
            {mode == "date" && head == "수록 날짜" && dateMode == "early" && (
              <span className="early">{`(${song["date"]["earlyPlatform"]})`}</span>
            )}
          </td>
        );
      });
    }

    trs.push(
      <tr key={song["uniqueTitle"]}>
        <th className="title" rowSpan={["levels", "notes", "noteDensity"].includes(mode) ? 5 : 1}>
          <img
            src={`${song["urlTitle"]}_1.png`}
            hidden={!["levels", "notes", "noteDensity"].includes(mode)}
            loading="lazy"
          />
          <p className={["levels", "notes", "noteDensity"].includes(mode) ? "narrow" : ""}>{song["uniqueTitle"]}</p>
        </th>
        {tds}
      </tr>
    );

    if (["levels", "notes", "noteDensity"].includes(mode)) {
      commonHeads.slice(1).forEach((btn) => {
        trs.push(
          <tr className="levels-notes" key={song["uniqueTitle"] + btn}>
            <th className={`${btn}-color`}>{btn}</th>
            {ranks.map((rank) =>
              mode == "levels" ? (
                <Level key={rank} rank={rank} level={song["level"][btn][rank]} condition={rank in song["level"][btn]} />
              ) : mode == "notes" ? (
                <td key={rank}>{rank in song["note"][btn] ? song["note"][btn][rank] : "　"}</td>
              ) : (
                <td key={rank}>
                  {rank in song["noteDensity"][btn] ? song["noteDensity"][btn][rank].toFixed(2) : "　"}
                </td>
              )
            )}
            {btn == "4B" && <td rowSpan="5">{list["dlcKor"][song["category"]]}</td>}
          </tr>
        );
      });
    }
  });

  return trs;
}

function Category({ mode }) {
  let filteredCategoryData;

  if (mode == "noteAvg") {
    filteredCategoryData = categoryData.filter((catDat) => Object.values(catDat["noteSum"]).every((note) => note > 0));
  }

  return (filteredCategoryData || categoryData).map((catDat) => {
    let category = catDat["category"];

    return (
      <tr key={category}>
        <th style={getCategoryStyle(category, list["collaboration"])}>{list["dlcKor"][category]}</th>
        {tableHeads[mode]
          .filter((head) => head != "카테고리")
          .map((head) => {
            let data;

            switch (mode) {
              case "levelAvg":
                data = catDat["levelAvg"][head].toFixed(2);
                break;
              case "patternCount":
                data = head == "SC 비율" ? `${catDat[head].toFixed(1)}%` : catDat["patternCount"][head];
                break;
              case "patternCountAvg":
                data = catDat["patternCountAvg"][head].toFixed(2);
                break;
              case "noteAvg":
                data = catDat["noteAvg"][head].toFixed(1);
                break;
            }

            return <td key={head}>{data}</td>;
          })}
      </tr>
    );
  });
}

function Histogram({ mode }) {
  switch (mode) {
    case "levelHistogram":
      return levelCountList.map((lc) => (
        <tr key={lc["level"]}>
          <th>{lc["level"]}</th>
          {commonHeads.map((head) => (
            <td key={head}>{lc[head]}</td>
          ))}
        </tr>
      ));
    case "patternCountHistogram":
      return patternCountList.map((pc) => (
        <tr key={pc["patternCount"]}>
          <th>{pc["patternCount"]}</th>
          <th>{pc["전체"]}</th>
        </tr>
      ));
    case "noteHistogram":
      return noteCountList.map((nc) => (
        <tr key={nc["note"]}>
          <th>{nc["note"]}</th>
          {commonHeads.map((head) => (
            <td key={head}>{nc[head]}</td>
          ))}
        </tr>
      ));
  }
}

function LevelsNotesSort({ mode, btnSelect, rankSelect }) {
  let filteredLevelNoteList;

  if (["notes", "noteDensity"].includes(mode)) {
    filteredLevelNoteList = levelNoteList.filter((levelNote) => levelNote["note"] > 0);
  }

  return (filteredLevelNoteList || levelNoteList)
    .filter((levelNote) => btnSelect.has(levelNote["btn"]) && rankSelect.has(levelNote["rank"]))
    .map((levelNote) => (
      <tr key={levelNote["title"] + levelNote["btn"] + levelNote["rank"]}>
        {/* className="levels-notes-sort" */}
        <th>{levelNote["title"]}</th>
        <th className={`${levelNote["btn"]}-color`}>{levelNote["btn"]}</th>
        {ranks.map((rank) =>
          mode == "levels" ? (
            <Level key={rank} rank={rank} level={levelNote["level"]} condition={levelNote["rank"] == rank} />
          ) : mode == "notes" ? (
            <td key={rank}>{levelNote["rank"] == rank ? levelNote["note"] : "　"}</td>
          ) : (
            <td key={rank}>{levelNote["rank"] == rank ? levelNote["noteDensity"].toFixed(2) : "　"}</td>
          )
        )}
        <td>{list["dlcKor"][levelNote["category"]]}</td>
      </tr>
    ));
}

function Level({ rank, level, condition }) {
  return (
    <td>
      {/* <span className={`${(rank == "SC")? "SC" : (level <= 5)? "NM" : (level <=10)? "HD" : "MX"}-color`}>
                ★
            </span> */}
      {condition && (
        <svg
          className={`${rank == "SC" ? "SC" : level <= 5 ? "NM" : level <= 10 ? "HD" : "MX"}-svg`}
          width="1em"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 27 28"
        >
          <use href="#star" />
        </svg>
      )}
      {condition ? level : "　"}
    </td>
  );
}

function Tfoot({ mode, titleMode, bpmMode }) {
  let trs = [];

  if (
    ["patternCountAvg", "date", "levels", "notes", "noteDensity"].includes(mode) ||
    (["levelAvg", "noteAvg"].includes(mode) && titleMode == "category")
  ) {
    return trs;
  }

  let heads = tableHeads[mode].filter((head) => head != "카테고리");

  if (mode == "patternCount") {
    heads = heads.slice(0, -1);
  }

  if (mode != "patternCountHistogram") {
    trs.push(
      <tr key="avg">
        <th>평균</th>
        {heads.map((head) => {
          let data;

          switch (mode) {
            case "levelAvg":
              data = totalLevelAvg[head].toFixed(2);
              break;
            case "patternCount":
              data =
                titleMode == "title"
                  ? (totalPatternCount[head] / songs.length).toFixed(1)
                  : (totalPatternCount[head] / categoryData.length).toFixed(1);
              break;
            case "length":
              data = `${Math.floor(totalLengthAvg / 60)}분 ${totalLengthAvg % 60}초`;
              break;
            case "bpm":
              data = (
                (bpmMode == "min" ? totalBpmMin : bpmMode == "mid" ? totalBpmMid : totalBpmMax) / songs.length
              ).toFixed(1);
              break;
            case "minLevel":
              data = totalMinLevelAvg[head].toFixed(1);
              break;
            case "maxLevel":
              data = totalMaxLevelAvg[head].toFixed(1);
              break;
            case "noteAvg":
              data = totalNoteAvg[head].toFixed(1);
              break;
            case "levelHistogram":
              data = (levelCountList.reduce((a, b) => a + b[head], 0) / levelCountList.length).toFixed(1);
              break;
            case "noteHistogram":
              data = (noteCountList.reduce((a, b) => a + b[head], 0) / noteCountList.length).toFixed(1);
              break;
          }

          return <th key={head}>{data}</th>;
        })}
      </tr>
    );
  }

  if (["patternCount", "patternCountHistogram", "length"].includes(mode)) {
    trs.push(
      <tr key="sum">
        <th>합계</th>
        {heads.map((head) => {
          let data;

          switch (mode) {
            case "patternCount":
              data = totalPatternCount[head];
              break;
            case "patternCountHistogram":
              data = patternCountList.reduce((a, b) => a + b["전체"], 0);
              break;
            case "length":
              let minutes = totalLengthSum % 3600;
              data = `${Math.floor(totalLengthSum / 3600)}시간 ${Math.floor(minutes / 60)}분 ${minutes % 60}초`;
              break;
          }

          return <th key={head}>{data}</th>;
        })}
      </tr>
    );

    if (mode == "patternCount") {
      trs.push(
        <tr key="ratio">
          <th>비율</th>
          {heads.map((head, i) => (
            <th key={head}>
              {i == 0 ? "" : `${((totalPatternCount[head] / totalPatternCount["전체"]) * 100).toFixed(1)}%`}
            </th>
          ))}
        </tr>
      );
    }
  }

  return <tfoot>{trs}</tfoot>;
}

function sortTable({ target, mode, titleMode, bpmMode, dateMode, isLevelsNotesSort, setSort }) {
  let th = target.closest("th");
  let label = target.closest("label");

  // console.log(target.nodeName);
  if (
    target.matches("tr, input") ||
    !(th.matches(".click") || label?.matches(".click")) ||
    target.closest("div").matches(".subSelectMode")
  ) {
    return;
  }

  let input = label?.querySelector("input");
  let checked = input?.checked;

  if (
    (target.matches("label") && checked === false) || //label 클릭시 제목/카테고리 전환할 때
    (input && input.value != titleMode) //input, span 클릭시 제목/카테고리 전환할 때 or label의 input이 체크박스일 때
  ) {
    return;
  }

  let head = th.matches(".click")
    ? th.firstChild.textContent
    : label.firstElementChild.nextSibling?.textContent || label.firstChild.textContent;
  let span = (th.matches(".click") ? th : label).querySelector("span");
  // console.log(head);
  if (th.matches(".categorySort") || label?.matches(".categorySort")) {
    //오름차순 정렬만
    document.querySelector("th[data-sorted]")?.removeAttribute("data-sorted");
    th.dataset.sorted = ASC;
  } else {
    if (th.dataset.sorted) {
      //정렬 전환
      th.dataset.sorted = span.textContent == ASC ? DES : ASC;
      span.textContent = span.textContent == ASC ? DES : ASC;
    } else {
      //정렬 유지
      document.querySelector("th[data-sorted]")?.removeAttribute("data-sorted");
      th.dataset.sorted = span.textContent;
    }
  }

  let order = th.dataset.sorted;
  // console.log(getTbodyMode(mode, titleMode, isLevelsNotesSort));
  switch (getTbodyMode(mode, titleMode, isLevelsNotesSort)) {
    case "title":
      sortTitle({ mode, head, order, bpmMode, dateMode });
      break;
    case "category":
      sortCategory({ mode, head, order });
      break;
    case "histogram":
      sortHistogram({ mode, head, order });
      break;
    case "levelsNotesSort":
      sortLevelsNotes({ mode, head, order });
      break;
  }
  setSort((cur) => (cur == ASC ? DES : ASC));
}

function sortTitle({ mode, head, order, bpmMode, dateMode }) {
  if (head == "제목") {
    songs.sort((a, b) =>
      order == ASC
        ? a["title"].toLowerCase().localeCompare(b["title"].toLowerCase())
        : b["title"].toLowerCase().localeCompare(a["title"].toLowerCase())
    );
  } else if (head == "카테고리") {
    if (mode == "length") {
      songs.sort((a, b) => {
        if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
          // if (a["length"] == b["length"]) {
          let prev = document.querySelector("#titleLabel span").textContent;
          return prev == ASC
            ? a["title"].toLowerCase().localeCompare(b["title"].toLowerCase())
            : b["title"].toLowerCase().localeCompare(a["title"].toLowerCase());
          // }
          // let prev = document.querySelector("#length span").textContent;
          // return (
          //     (prev == ASC)
          //         ? a["length"] - b["length"]
          //         : b["length"] - a["length"]
          // );
        }
        return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
      });
    } else if (mode == "date") {
      songs.sort((a, b) => {
        if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
          if (a["date"][dateMode] - b["date"][dateMode] == 0) {
            //a["date"][dateMode].valueOf() == b[dateMode]["PC"].valueOf()
            let prev = document.querySelector("#titleLabel span").textContent;
            return prev == ASC
              ? a["title"].toLowerCase().localeCompare(b["title"].toLowerCase())
              : b["title"].toLowerCase().localeCompare(a["title"].toLowerCase());
          }
          let prev = document.querySelector("#date span").textContent;
          return prev == ASC ? a["date"][dateMode] - b["date"][dateMode] : b["date"][dateMode] - a["date"][dateMode];
        }
        return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
      });
    } else {
      songs.sort((a, b) => {
        if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
          let prev = document.querySelector("#titleLabel span").textContent;
          return prev == ASC
            ? a["title"].toLowerCase().localeCompare(b["title"].toLowerCase())
            : b["title"].toLowerCase().localeCompare(a["title"].toLowerCase());
        }
        return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
      });
    }
  } else {
    switch (mode) {
      case "levelAvg":
      case "minLevel":
      case "maxLevel":
      case "patternCount":
      case "noteAvg":
        songs.sort((a, b) => {
          if (a[mode][head] == b[mode][head]) {
            return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
          }
          return order == ASC ? a[mode][head] - b[mode][head] : b[mode][head] - a[mode][head];
        });
        break;
      case "length":
        songs.sort((a, b) => {
          if (a["length"] == b["length"]) {
            return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
          }
          return order == ASC ? a["length"] - b["length"] : b["length"] - a["length"];
        });
        break;
      case "bpm":
        songs.sort((a, b) => {
          if (bpmToNumber(a["bpm"], bpmMode) == bpmToNumber(b["bpm"], bpmMode)) {
            return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
          }
          return order == ASC
            ? bpmToNumber(a["bpm"], bpmMode) - bpmToNumber(b["bpm"], bpmMode)
            : bpmToNumber(b["bpm"], bpmMode) - bpmToNumber(a["bpm"], bpmMode);
        });
        break;
      case "date":
        songs.sort((a, b) => {
          if (a["date"][dateMode] - b["date"][dateMode] == 0) {
            if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return order == ASC
              ? categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"])
              : categoryList.indexOf(b["category"]) - categoryList.indexOf(a["category"]);
          }
          return order == ASC ? a["date"][dateMode] - b["date"][dateMode] : b["date"][dateMode] - a["date"][dateMode];
        });
        break;
    }
  }
}

function sortCategory({ mode, head, order }) {
  if (head == "카테고리") {
    categoryData.sort((a, b) => categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]));
  } else if (head == "SC 비율") {
    categoryData.sort((a, b) => {
      if (a[head] == b[head]) {
        return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
      }
      return order == ASC ? a[head] - b[head] : b[head] - a[head];
    });
  } else {
    categoryData.sort((a, b) => {
      if (a[mode][head] == b[mode][head]) {
        return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
      }
      return order == ASC ? a[mode][head] - b[mode][head] : b[mode][head] - a[mode][head];
    });
  }
}

function sortHistogram({ mode, head, order }) {
  if (head == "레벨") {
    levelCountList.sort((a, b) => (order == ASC ? a["level"] - b["level"] : b["level"] - a["level"]));
  } else if (head == "패턴 개수") {
    patternCountList.sort((a, b) =>
      order == ASC ? a["patternCount"] - b["patternCount"] : b["patternCount"] - a["patternCount"]
    );
  } else if (head == "노트 수") {
    noteCountList.sort((a, b) =>
      order == ASC
        ? parseInt(a["note"].split(" ~ ")[0]) - parseInt(b["note"].split(" ~ ")[0])
        : parseInt(b["note"].split(" ~ ")[0]) - parseInt(a["note"].split(" ~ ")[0])
    );
  } else {
    switch (mode) {
      case "levelHistogram":
        levelCountList.sort((a, b) => {
          if (a[head] == b[head]) {
            return order == ASC ? a["level"] - b["level"] : b["level"] - a["level"];
          }
          return order == ASC ? a[head] - b[head] : b[head] - a[head];
        });
        break;
      case "patternCountHistogram":
        patternCountList.sort((a, b) => {
          if (a["전체"] == b["전체"]) {
            return order == ASC ? a["patternCount"] - b["patternCount"] : b["patternCount"] - a["patternCount"];
          }
          return order == ASC ? a["전체"] - b["전체"] : b["전체"] - a["전체"];
        });
        break;
      case "noteHistogram":
        noteCountList.sort((a, b) => {
          if (a[head] == b[head]) {
            return order == ASC
              ? parseInt(a["note"].split(" ~ ")[0]) - parseInt(b["note"].split(" ~ ")[0])
              : parseInt(b["note"].split(" ~ ")[0]) - parseInt(a["note"].split(" ~ ")[0]);
          }
          return order == ASC ? a[head] - b[head] : b[head] - a[head];
        });
        break;
    }
  }
}

function sortLevelsNotes({ mode, head, order }) {
  if (head == "제목") {
    levelNoteList.sort((a, b) => {
      if (a["title"] == b["title"]) {
        if (a["btn"] == b["btn"]) {
          return ranks.indexOf(a["rank"]) - ranks.indexOf(b["rank"]);
        }
        return commonHeads.indexOf(a["btn"]) - commonHeads.indexOf(b["btn"]);
      }
      return order == ASC
        ? a["title"].toLowerCase().localeCompare(b["title"].toLowerCase())
        : b["title"].toLowerCase().localeCompare(a["title"].toLowerCase());
    });
  } else if (head == "카테고리") {
    levelNoteList.sort((a, b) => {
      if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
        if (a["title"] == b["title"]) {
          if (a["btn"] == b["btn"]) {
            return ranks.indexOf(a["rank"]) - ranks.indexOf(b["rank"]);
          }
          return commonHeads.indexOf(a["btn"]) - commonHeads.indexOf(b["btn"]);
        }
        let prev = document.querySelector("#titleLabel span").textContent;
        return prev == ASC
          ? a["title"].toLowerCase().localeCompare(b["title"].toLowerCase())
          : b["title"].toLowerCase().localeCompare(a["title"].toLowerCase());
      }
      return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
    });
  } else {
    let key = mode == "levels" ? "level" : mode == "notes" ? "note" : "noteDensity";

    levelNoteList.sort((a, b) => {
      if (a[key] == b[key]) {
        if (a["btn"] == b["btn"]) {
          if (a["rank"] == b["rank"]) {
            return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
          }
          return order == ASC
            ? ranks.indexOf(a["rank"]) - ranks.indexOf(b["rank"])
            : ranks.indexOf(b["rank"]) - ranks.indexOf(a["rank"]);
        }
        return order == ASC
          ? commonHeads.indexOf(a["btn"]) - commonHeads.indexOf(b["btn"])
          : commonHeads.indexOf(b["btn"]) - commonHeads.indexOf(a["btn"]);
      }
      return order == ASC ? a[key] - b[key] : b[key] - a[key];
    });
  }
}

function Graph({ mode, tbodyMode }) {
  let x, y, heads, text, orientation, height, xrange, yrange, margin;
  let levelCountSorted = [...levelCountList].sort((a, b) => a["level"] - b["level"]);
  let patternCountSorted = [...patternCountList].sort((a, b) => a["patternCount"] - b["patternCount"]);
  let noteCountSorted = [...noteCountList].sort(
    (a, b) => parseInt(a["note"].split(" ~ ")[0]) - parseInt(b["note"].split(" ~ ")[0])
  );
  let categoryDataSorted = [...categoryData].sort(
    (a, b) => categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"])
  );

  if (mode == "levelHistogram") {
    heads = tableHeads[mode];
    // x = Array.from({length: MAX_LEVEL}, (_, i) => i+1);
    x = levelCountSorted.map((lc) => lc["level"]);
    y = heads.map((head) => levelCountSorted.map((lc) => lc[head]));
  } else if (mode == "patternCountHistogram") {
    heads = ["전체"];
    x = patternCountSorted.map((pc) => pc["patternCount"]);
    y = [patternCountSorted.map((pc) => pc["전체"])];
  } else if (mode == "noteHistogram") {
    heads = tableHeads[mode];
    x = noteCountSorted.map((nc) => nc["note"]);
    y = heads.map((head) => noteCountSorted.map((nc) => nc[head]));
  } else if (["levelAvg", "patternCountAvg", "noteAvg"].includes(mode) && tbodyMode == "category") {
    heads = commonHeads;
    x = categoryList.map((category) => list["dlcKor"][category]);

    if (mode == "noteAvg") {
      categoryDataSorted = categoryDataSorted.filter((catDat) =>
        Object.values(catDat["noteSum"]).every((note) => note > 0)
      );
      x = categoryDataSorted.map((catDat) => list["dlcKor"][catDat["category"]]);
    }
    y = heads.map((head) => categoryDataSorted.map((catDat) => catDat[mode][head]));

    if (mode == "levelAvg") {
      // text = (data) => data.toFixed(2);
      yrange = (y) => [Math.min(...y) - 1, Math.max(...y) + 1];
    }
    if (mode == "patternCountAvg") {
      // yrange = (y) => [Math.min(...y) - 0.5, Math.max(...y) + 0.5];
    }
  } else if (mode == "patternCount") {
    heads = [...commonHeads, "SC"];
    x = categoryList.map((category) => list["dlcKor"][category]);
    y = heads.map((head) => categoryDataSorted.map((catDat) => catDat[mode][head]));
    text = String;
  } else if (mode == "levelAvg" && tbodyMode == "title") {
    // heads = ["전체"];
    heads = [];
    let songSorted = [...songs].sort((a, b) => a["levelAvg"]["전체"] - b["levelAvg"]["전체"]);
    x = [songSorted.map((song) => song["levelAvg"]["전체"])];
    y = songSorted.map((song) => song["uniqueTitle"]);
    orientation = "h";
    height = 10000;
    xrange = [Math.min(...x[0]) - 0.5, Math.max(...x[0]) + 0.5];
    margin = {
      l: 350,
    };
  }

  React.useEffect(() => {
    //렌더링이 끝난 후 호출됨. Real DOM에 접근 가능.
    heads.forEach((head, i) => {
      drawGraph({
        mode,
        tbodyMode,
        head,
        x: orientation ? x[i] : x,
        y: orientation ? y : y[i],
        text,
        orientation,
        height: height || "auto",
        xrange,
        yrange: yrange ? yrange(y[i]) : null,
        margin,
      });
    });
  }, [mode, tbodyMode]);

  return (
    <div id="graph">
      {heads.map((head) => (
        <div key={head} id={`graph-${mode}-${tbodyMode}-${head}`}></div>
      ))}
    </div>
  );
}

function drawGraph({ mode, tbodyMode, head, x, y, text, orientation, height, xrange, yrange, margin }) {
  let trace = {
    x,
    y,
    orientation,
    type: "bar",
    text,
    marker: {
      line: {
        width: 1.5,
      },
    },
  };
  let data = [trace];
  let layout = {
    title: head,
    // autosize: false,
    height,
    margin,
    xaxis: {
      dtick: 1,
      range: xrange,
    },
    yaxis: {
      // dtick: "auto",
      range: yrange,
    },
  };
  Plotly.newPlot(`graph-${mode}-${tbodyMode}-${head}`, data, layout, {
    staticPlot: true,
    responsive: true,
  });
}

function getTbodyMode(mode, titleMode, isLevelsNotesSort) {
  if (mode.includes("Histogram")) {
    return "histogram";
  } else if (["levels", "notes", "noteDensity"].includes(mode) && isLevelsNotesSort) {
    return "levelsNotesSort";
  } else if (
    (["levelAvg", "patternCount", "noteAvg"].includes(mode) && titleMode == "category") ||
    mode == "patternCountAvg"
  ) {
    return "category";
  } else {
    return "title";
  }
}

function bpmToNumber(bpm, mode) {
  if (isNaN(bpm)) {
    let [min, max] = bpm.split(" ~ ").map((bpm) => Number(bpm));
    switch (mode) {
      case "min":
        return min;
      case "mid":
        return (min + max) / 2;
      case "max":
        return max;
    }
  }
  return Number(bpm);
}

ReactDOM.render(<App />, document.querySelector("#result"));
