table = document.querySelector("#statResult");
thead = table.tHead;
[titleTbody, categoryTbody, levelsTbody] = table.tBodies;
tfoot = table.tFoot;

commonHeads = ["전체", "4B", "5B", "6B", "8B"];
tableHeads = {
  levelAvg: commonHeads,
  patternCount: [...commonHeads, "SC", "SC 비율"],
  patternCountAvg: [...commonHeads, "SC"],
  length: ["길이", "카테고리"],
  bpm: ["BPM"],
  date: ["수록 날짜", "카테고리"],
  minLevel: commonHeads,
  maxLevel: commonHeads,
  levels: ["버튼", "레벨", "카테고리"],
  notes: ["버튼", "레벨", "카테고리"],
};
ranks = ["NM", "HD", "MX", "SC"];

histogramTable = document.querySelector("#histogramTable");
const MIN_LEVEL = 1;
const MAX_LEVEL = 15;
const ASC = "asc";
const DES = "des";

fetch("../db.json")
  .then((response) => response.json())
  .then((json) => {
    list = json;
    [songs, categoryData] = [[], []];
    categoryList = Object.keys(list["songs"]); //인덱스 참조로 사용

    for (let category in list["songs"]) {
      let catDat = { category: category, sum: {}, patternCount: {}, avg: {} };
      commonHeads.forEach((head) => {
        catDat["sum"][head] = catDat["patternCount"][head] = catDat["avg"][head] = 0;
      });
      catDat["patternCount"]["SC"] = 0;
      for (let song of list["songs"][category]) {
        song["category"] = category;
        for (let platform in song["date"]) {
          song["date"][platform] = new Date(song["date"][platform]);
        }
        let [sum, patternCount, avg, min, max, levelCount] = [{}, {}, {}, {}, {}, {}];
        commonHeads.forEach((head) => {
          sum[head] = patternCount[head] = avg[head] = 0;
        });
        patternCount["SC"] = 0;

        for (let btn in song["level"]) {
          for (let rank in song["level"][btn]) {
            let level = song["level"][btn][rank];
            sum[btn] += level;
            sum["전체"] += level;
            patternCount[btn] += 1;
            patternCount["전체"] += 1;
            catDat["sum"][btn] += level;
            catDat["sum"]["전체"] += level;
            catDat["patternCount"][btn] += 1;
            catDat["patternCount"]["전체"] += 1;
            if (rank == "SC") {
              patternCount["SC"] += 1;
              catDat["patternCount"]["SC"] += 1;
            }
            if (!(level in levelCount)) {
              levelCount[level] = { 전체: 0 };
            }
            if (!(btn in levelCount[level])) {
              levelCount[level][btn] = 0;
            }
            levelCount[level][btn] += 1;
            levelCount[level]["전체"] += 1;
          }
          let values = Object.values(song["level"][btn]);
          min[btn] = Math.min(...values);
          max[btn] = Math.max(...values);
        }
        min["전체"] = Math.min(...Object.values(min));
        max["전체"] = Math.max(...Object.values(max));
        for (let btn in avg) {
          avg[btn] = sum[btn] / patternCount[btn];
        }
        song["sum"] = sum;
        song["patternCount"] = patternCount;
        song["avg"] = avg;
        song["min"] = min;
        song["max"] = max;
        song["levelCount"] = levelCount;
        songs.push(song);
      }
      commonHeads.forEach((head) => {
        catDat["avg"][head] = catDat["sum"][head] / catDat["patternCount"][head];
      });
      catDat["SCpercent"] = (catDat["patternCount"]["SC"] / catDat["patternCount"]["전체"]) * 100;
      catDat["songCount"] = list["songs"][category].length;
      categoryData.push(catDat);
    }

    totalPatternCount = {};
    tableHeads["patternCount"].forEach((head) => {
      totalPatternCount[head] = 0;
    });
    levelList = {};
    commonHeads.slice(1).forEach((head) => {
      levelList[head] = [];
    });
    songs.forEach((song) => {
      for (let btn in song["patternCount"]) {
        totalPatternCount[btn] += song["patternCount"][btn];
      }
      for (let btn in song["level"]) {
        for (let rank in song["level"][btn]) {
          levelList[btn].push({
            title: song["uniqueTitle"],
            rank,
            level: song["level"][btn][rank],
          });
        }
      }
    });
    songs.sort((a, b) => a["title"].toLowerCase().localeCompare(b["title"].toLowerCase()));
    // songs = songs.map(a => ([Math.random(),a])).sort((a,b) => a[0]-b[0]).map(a => a[1]);

    tableInit(); //테이블 틀 생성

    document.querySelectorAll("table").forEach((table) => {
      table.hidden = false;
    });

    document.querySelector("#result").addEventListener("click", (event) => {
      let th = event.target.closest("th");
      let div = event.target.closest("div");

      if (event.target.matches("input") || div.id == "bpmModeDiv") {
        return;
      }

      if (th?.matches(".click") || div?.matches(".click")) {
        if (th.matches(".categorySort") || div.matches(".categorySort")) {
          document.querySelector("th[data-sorted]")?.removeAttribute("data-sorted");
          th.dataset.sorted = ASC;
          if (th.parentNode.className == "firstColumn") {
            categoryData.sort(
              (a, b) => categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"])
            );
            writeTableCategory();
          } else if (["levels", "notes"].includes(th.parentNode.className)) {
            songs.sort((a, b) => {
              if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
                let prev = thead.querySelector("#titleDiv span").textContent;
                if (prev == "▲") {
                  return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
                } else if (prev == "▼") {
                  return b["title"].toLowerCase().localeCompare(a["title"].toLowerCase());
                }
              }
              return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
            });
            writeTable();
          } else if (th.parentNode.className == "date") {
            songs.sort((a, b) => {
              if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
                if (a["date"]["PC"].valueOf() == b["date"]["PC"].valueOf()) {
                  return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
                }
                let prev = th.previousElementSibling.querySelector("span").textContent;
                if (prev == "▲") {
                  return a["date"]["PC"].valueOf() - b["date"]["PC"].valueOf();
                } else if (prev == "▼") {
                  return b["date"]["PC"].valueOf() - a["date"]["PC"].valueOf();
                }
              }
              return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
            });
            writeTable();
          }
        } else {
          let span = th.querySelector("span");
          let head = th.firstChild.textContent;
          if (th.dataset.sorted) {
            th.dataset.sorted = span.textContent == "▼" ? ASC : DES;
            span.textContent = span.textContent == "▼" ? "▲" : "▼";
          } else {
            document.querySelector("th[data-sorted]")?.removeAttribute("data-sorted");
            th.dataset.sorted = span.textContent == "▼" ? DES : ASC;
          }

          if (mode == "histogram") {
            sortHistogram(head, th.dataset.sorted);
          } else {
            sortSong(th.parentNode.className, head, th.dataset.sorted);
          }
        }
      }
    });

    document.querySelector("#selectMode").addEventListener("change", (event) => {
      mode = event.target.value;
      let [titleBtn, categoryBtn] = thead.querySelectorAll("input[name='titleMode']");

      selectAttribute(
        `#${mode != "histogram" ? "stat" : "histogram"}`,
        "hidden",
        false,
        true,
        ...document.querySelectorAll("#stat, #histogram")
      );
      selectAttribute(
        `.${mode}`,
        "hidden",
        false,
        true,
        ...document.querySelectorAll("#graph > div")
      );

      if (mode != "histogram") {
        selectAttribute(
          `.${mode}`,
          "hidden",
          false,
          true,
          ...table.querySelectorAll("tr:not(.firstColumn):not(.levelsSortTr)")
        );
        toggleAttribute(
          "hidden",
          !["levels", "notes"].includes(mode),
          ...titleTbody.querySelectorAll("img")
        );
        toggleAttribute(
          "rowSpan",
          ["levels", "notes"].includes(mode) ? 5 : 2,
          ...titleTbody.querySelectorAll("th.title")
        );

        thead.querySelector("#titleDiv").style.display = mode != "patternCountAvg" ? "" : "none";
        thead.querySelector("#categoryDiv").style.display = [
          "levelAvg",
          "patternCount",
          "patternCountAvg",
        ].includes(mode)
          ? ""
          : "none";
        toggleAttribute(
          "hidden",
          !["levelAvg", "patternCount"].includes(mode),
          thead.querySelector("#seperator"),
          titleBtn,
          categoryBtn
        );

        thead.querySelector("th").rowSpan = ["levels", "notes"].includes(mode) ? 3 : 2;
        if (mode == "levels") {
          thead
            .querySelector("#levelsSort input")
            .dispatchEvent(new InputEvent("change", { bubbles: true }));
        } else {
          levelsTbody.hidden = true;
        }

        toggleAttribute(
          "hidden",
          ["patternCountAvg", "levels", "notes"].includes(mode),
          ...tfoot.querySelectorAll(`.avg.firstColumn, .avg.${mode}`)
        );
        toggleAttribute(
          "hidden",
          !["patternCount", "length"].includes(mode),
          ...tfoot.querySelectorAll(`.sum.firstColumn, .sum.${mode}`)
        );
        toggleAttribute(
          "hidden",
          mode != "patternCount",
          ...tfoot.querySelectorAll(`.ratio.firstColumn, .ratio.${mode}`)
        );

        if (["levelAvg", "patternCount"].includes(mode)) {
          (titleBtn.checked ? titleBtn : categoryBtn).dispatchEvent(
            new InputEvent("change", { bubbles: true })
          );
        } else if (mode != "levels") {
          (mode == "patternCountAvg" ? categoryBtn : titleBtn).dispatchEvent(
            new InputEvent("change", { bubbles: true })
          );
        }
      }
    });
    document.querySelectorAll("input[checked]").forEach((input) => {
      input.dispatchEvent(new InputEvent("change", { bubbles: true }));
    });
    document
      .querySelector("input[type='checkbox']")
      .dispatchEvent(new InputEvent("change", { bubbles: true }));

    levelAvg(); //레벨 평균 초기 설정
    patternCount(); //패턴 개수 초기 설정
    patternCountAvg(); //패턴 평균 개수 초기 설정
    length(); //곡 길이 초기 설정
    bpm(); //bpm 초기 설정
    date(); //날짜 초기 설정
    minLevel(); //최소 레벨 초기 설정
    maxLevel(); //최대 레벨 초기 설정
    levels(); //레벨 목록 초기 설정
    notes(); //노트수 목록 초기 설정
    writeLevelAvgCategory(); //레벨 평균(카테고리) 값 채우기
    writePatternCountCategory(); //패턴 개수(카테고리) 값 채우기
    histogramInit();
    histogram();

    document.querySelector("#fallback").remove();
  });

function tableInit() {
  thead.querySelector("th").addEventListener("change", (event) => {
    titleMode = event.target.value;

    selectAttribute(
      `#${titleMode == "title" ? "titleTbody" : "categoryTbody"}`,
      "hidden",
      false,
      true,
      titleTbody,
      categoryTbody
    );

    toggleAttribute(
      "hidden",
      !(mode == "patternCount" && titleMode == "category"),
      ...table.querySelectorAll(".SCpercent")
    );

    tfoot.hidden =
      ["patternCountAvg", "date", "levels", "notes"].includes(mode) ||
      (mode == "levelAvg" && titleMode == "category");
    if (mode == "patternCount") {
      selectAttribute(
        `.${titleMode == "title" ? "title" : "category"}`,
        "hidden",
        false,
        true,
        ...tfoot.querySelectorAll(".avg.patternCount")
      );
    }

    document.querySelector("#graph .levelAvg").hidden = !(
      mode == "levelAvg" && titleMode == "category"
    );
  });

  // titleTbody에 곡 제목 tr 생성
  songs.forEach(() => {
    let template = document.querySelector("#titleTemplate").content.cloneNode(true);
    titleTbody.append(...template.children);
  });

  // categoryTbody에 카테고리 tr 생성
  for (let category in list["songs"]) {
    let template = document.querySelector("#categoryTemplate").content.cloneNode(true);
    let tr = template.firstElementChild;
    tr.id = category;
    categoryTbody.append(tr);
  }

  // levelsTbody에 tr 생성
  for (
    let i = 0;
    i <
    Math.max(
      totalPatternCount["4B"],
      totalPatternCount["5B"],
      totalPatternCount["6B"],
      totalPatternCount["8B"]
    );
    i++
  ) {
    let tr = document.createElement("tr");
    tr.className = "levelsSortTr";
    tr.append(document.createElement("th"));
    for (let i = 0; i < ranks.length; i++) {
      tr.append(document.createElement("td"));
    }
    levelsTbody.append(tr);
  }

  for (let mode in tableHeads) {
    // thead에 분류명 th 생성
    let tr = document.createElement("tr");
    tableHeads[mode].forEach((head, i) => {
      tr.className = mode;

      let th = document.createElement("th");
      th.textContent = head;

      let isSortClick =
        !["length", "levels", "notes"].includes(mode) ||
        (mode == "length" && head == "길이") ||
        (mode == "levels" && ["레벨", "카테고리"].includes(head)) ||
        (mode == "notes" && head == "카테고리");
      if (isSortClick) {
        th.className = "click";
      }
      if (["date", "levels", "notes"].includes(mode) && head == "카테고리") {
        th.classList.add("categorySort");
      }
      if (mode == "patternCount" && head == "SC 비율") {
        th.classList.add("SCpercent");
      }
      if (commonHeads.includes(head)) {
        th.classList.add(`${head}-background`, "btn-rank");
      }
      if (head == "SC") {
        th.classList.add(head, "SC-background", "btn-rank");
      }

      if (isSortClick) {
        let span = document.createElement("span");
        span.className = "sort";
        span.textContent = "▲";
        if (mode == "levels" && head == "레벨") {
          span.hidden = true;
        }
        th.append(span);
      }
      if (mode == "bpm") {
        let bpmModeTemplate = document.querySelector("#bpmModeTemplate").content.cloneNode(true);
        th.append(bpmModeTemplate.firstElementChild);
      }
      if (["levels", "notes"].includes(mode)) {
        if (i == 0 || i == 2) {
          th.rowSpan = 3;
          if (mode == "levels") {
            th.classList.add("levelsNotSort");
          }
        } else {
          th.colSpan = 4;
          if (mode == "levels") {
            th.id = "levelsSort";
            let template = document.querySelector("#levelsTemplate").content.cloneNode(true);
            th.append(...template.children);
          }
        }
      }

      tr.append(th);
    });

    thead.append(tr);

    if (["levels", "notes"].includes(mode)) {
      let tr = document.createElement("tr");
      tr.className = mode;
      ranks.forEach((head) => {
        let th = document.createElement("th");
        th.textContent = head;
        th.className = `${head}-background btn-rank`;
        tr.append(th);
      });
      thead.append(tr);
    }

    // tbody에 각종 값 td 생성
    if (!["levels", "notes"].includes(mode)) {
      titleTbody.querySelectorAll("tr.firstColumn").forEach((first) => {
        let tr = document.createElement("tr");
        tr.className = mode;
        let length = mode == "patternCount" ? tableHeads[mode].length - 1 : tableHeads[mode].length;
        for (let i = 0; i < length; i++) {
          let td = document.createElement("td");
          if (mode == "bpm") {
            let span = document.createElement("span");
            span.className = "bpm mid";
            td.append("", span);
          } else if (mode == "date") {
            td.className = "category-background";
          }
          tr.append(td);
        }
        appendTemp(first, tr); //first.after(tr) 이면 순서가 거꾸로 됨
      });
      if (["levelAvg", "patternCount", "patternCountAvg"].includes(mode)) {
        categoryTbody.querySelectorAll("tr.firstColumn").forEach((first) => {
          let tr = document.createElement("tr");
          tr.className = mode;
          for (let i = 0; i < tableHeads[mode].length; i++) {
            let td = document.createElement("td");
            if (mode == "patternCount" && tableHeads[mode][i] == "SC 비율") {
              td.className = "SCpercent";
            }
            tr.append(td);
          }
          appendTemp(first, tr);
        });
      }
    }

    // tfoot에 평균 합계값 th 생성
    if (!["patternCountAvg", "date", "levels"].includes(mode)) {
      let tr = document.createElement("tr");
      tr.className = `avg ${mode}`;
      if (mode == "patternCount") {
        tr.classList.add("title");
      }
      let length = mode == "patternCount" ? tableHeads[mode].length - 1 : tableHeads[mode].length;
      for (let i = 0; i < length; i++) {
        let th = document.createElement("th");
        if (mode == "bpm") {
          let bpmModeTemplate = document.querySelector("#bpmModeTemplate").content.cloneNode(true);
          th.append(...bpmModeTemplate.querySelectorAll("span"));
        }
        tr.append(th);
      }
      appendTemp(tfoot.querySelector(".avg"), tr);

      if (mode == "patternCount") {
        tr = tr.cloneNode(true);
        tr.className = `avg ${mode} category`;
        appendTemp(tfoot.querySelector(".avg"), tr);
      }
    }
    if (["patternCount", "length"].includes(mode)) {
      let tr = document.createElement("tr");
      tr.className = `sum ${mode}`;
      let length = mode == "patternCount" ? tableHeads[mode].length - 1 : tableHeads[mode].length;
      for (let i = 0; i < length; i++) {
        let th = document.createElement("th");
        tr.append(th);
      }
      appendTemp(tfoot.querySelector(".sum"), tr);
    }
    if (mode == "patternCount") {
      let tr = document.createElement("tr");
      tr.className = `ratio ${mode}`;
      for (let i = 0; i < tableHeads[mode].length - 1; i++) {
        let th = document.createElement("th");
        tr.append(th);
      }
      appendTemp(tfoot.querySelector(".ratio"), tr);
    }
  }
  appendRestore();
  writeTitle();
  writeCategory();

  thead.querySelector("#bpmModeDiv").addEventListener("change", (event) => {
    bpmMode = event.target.value;
    selectAttribute(`.${bpmMode}`, "hidden", false, true, ...table.querySelectorAll("span.bpm"));

    let th = event.target.closest("th");
    if (th.dataset.sorted) {
      sortSong("bpm", "", th.dataset.sorted);
    }
  });

  thead.querySelector("#levelsSort").addEventListener("change", (event) => {
    if (event.target.matches("[type='checkbox']")) {
      isLevelsSort = event.target.checked;
      let levelsSort = thead.querySelector("#levelsSort");

      if (isLevelsSort) {
        levelsSort.classList.add("click");
      } else {
        levelsSort.classList.remove("click");
      }
      levelsSort.querySelector("span").hidden = !isLevelsSort;
      levelsSort.querySelector("div").hidden = !isLevelsSort;
      toggleAttribute("hidden", isLevelsSort, ...table.querySelectorAll(".levelsNotSort"));
      selectAttribute(
        `#${isLevelsSort ? "levelsTbody" : "titleTbody"}`,
        "hidden",
        false,
        true,
        titleTbody,
        levelsTbody
      );
    } else {
      levelsSortBtn = event.target.value;

      let th = event.target.closest("th");
      if (th.dataset.sorted) {
        sortSong("levels", "", th.dataset.sorted);
      } else {
        writeLevelsSort();
      }
    }
  });
}

function writeLevelAvg() {
  titleTbody.querySelectorAll("tr.levelAvg").forEach((tr, i) => {
    tr.querySelectorAll("td").forEach((td, j) => {
      td.textContent = songs[i]["avg"][tableHeads["levelAvg"][j]].toFixed(2);
    });
  });
}
function levelAvg() {
  let [totalSum, totalCount, totalAvg] = [{}, {}, {}];
  tableHeads["levelAvg"].forEach((head) => {
    totalSum[head] = totalCount[head] = totalAvg[head] = 0;
  });
  songs.forEach((song) => {
    for (let btn in song["sum"]) {
      totalSum[btn] += song["sum"][btn];
    }
    for (let btn in song["patternCount"]) {
      totalCount[btn] += song["patternCount"][btn];
    }
  });
  for (let btn in totalAvg) {
    totalAvg[btn] = totalSum[btn] / totalCount[btn];
  }

  writeLevelAvg();
  tfoot.querySelectorAll("tr.levelAvg th").forEach((th, i) => {
    th.textContent = totalAvg[tableHeads["levelAvg"][i]].toFixed(2);
  });

  let categoryDataSorted = [...categoryData].sort(
    (a, b) => categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"])
  );
  drawGraph(
    "levelAvg",
    categoryList.map((category) => list["dlcKor"][category]),
    commonHeads.map((head) => categoryDataSorted.map((catDat) => catDat["avg"][head].toFixed(2)))
  );
}

function writeLevelAvgCategory() {
  categoryTbody.querySelectorAll("tr.levelAvg").forEach((tr, i) => {
    tr.querySelectorAll("td").forEach((td, j) => {
      td.textContent = categoryData[i]["avg"][tableHeads["levelAvg"][j]].toFixed(2);
    });
  });
}

function writePatternCount() {
  titleTbody.querySelectorAll("tr.patternCount").forEach((tr, i) => {
    tr.querySelectorAll("td").forEach((td, j) => {
      td.textContent = songs[i]["patternCount"][tableHeads["patternCount"][j]];
    });
  });
}
function patternCount() {
  writePatternCount();
  tfoot
    .querySelector(".avg.patternCount.title")
    .querySelectorAll("th")
    .forEach((th, i) => {
      th.textContent = (totalPatternCount[tableHeads["patternCount"][i]] / songs.length).toFixed(1);
    });
  tfoot
    .querySelector(".avg.patternCount.category")
    .querySelectorAll("th")
    .forEach((th, i) => {
      th.textContent = (
        totalPatternCount[tableHeads["patternCount"][i]] / categoryData.length
      ).toFixed(1);
    });
  tfoot
    .querySelector(".sum.patternCount")
    .querySelectorAll("th")
    .forEach((th, i) => {
      th.textContent = totalPatternCount[tableHeads["patternCount"][i]];
    });
  tfoot
    .querySelector(".ratio.patternCount")
    .querySelectorAll("th")
    .forEach((th, i) => {
      if (i > 0) {
        let ratio =
          (totalPatternCount[tableHeads["patternCount"][i]] / totalPatternCount["전체"]) * 100;
        th.textContent = `${ratio.toFixed(1)}%`;
      }
    });
}

function writePatternCountCategory() {
  categoryTbody.querySelectorAll("tr.patternCount").forEach((tr, i) => {
    tr.querySelectorAll("td:not(.SCpercent)").forEach((td, j) => {
      td.textContent = categoryData[i]["patternCount"][tableHeads["patternCount"][j]];
    });
    tr.querySelector("td.SCpercent").textContent = `${categoryData[i]["SCpercent"].toFixed(1)}%`;
  });
}

function writePatternCountAvg() {
  categoryTbody.querySelectorAll("tr.patternCountAvg").forEach((tr, i) => {
    tr.querySelectorAll("td").forEach((td, j) => {
      td.textContent = categoryData[i]["patternCountAvg"][tableHeads["patternCount"][j]].toFixed(2);
    });
  });
}
function patternCountAvg() {
  categoryData.forEach((catDat) => {
    catDat["patternCountAvg"] = {};
    tableHeads["patternCountAvg"].forEach((head) => {
      catDat["patternCountAvg"][head] = catDat["patternCount"][head] / catDat["songCount"];
    });
  });
  writePatternCountAvg();

  let categoryDataSorted = [...categoryData].sort(
    (a, b) => categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"])
  );
  drawGraph(
    "patternCountAvg",
    categoryList.map((category) => list["dlcKor"][category]),
    commonHeads.map((head) =>
      categoryDataSorted.map((catDat) => catDat["patternCountAvg"][head].toFixed(2))
    )
  );
}

function writeLength() {
  titleTbody.querySelectorAll("tr.length").forEach((tr, i) => {
    let tds = tr.querySelectorAll("td");
    let len = songs[i]["length"];
    let category = songs[i]["category"];

    tds[0].textContent = `${parseInt(len / 60)}분 ${len % 60}초`;
    tds[1].textContent = list["dlcKor"][category];
  });
}
function length() {
  let totalLength = 0;
  songs.forEach((song) => {
    totalLength += song["length"];
  });
  let avgLength = parseInt(totalLength / songs.length);

  writeLength();
  tfoot.querySelector(".avg.length th").textContent = `${parseInt(avgLength / 60)}분 ${
    avgLength % 60
  }초`;
  let minutes = totalLength % 3600;
  tfoot.querySelector(".sum.length th").textContent = `${parseInt(
    totalLength / 3600
  )}시간 ${parseInt(minutes / 60)}분 ${minutes % 60}초`;
}

function writeBpm() {
  titleTbody.querySelectorAll("tr.bpm td").forEach((td, i) => {
    let bpm = songs[i]["bpm"];
    td.firstChild.textContent = bpm;

    let span = td.querySelector("span");
    if (isNaN(bpm)) {
      span.textContent = `(${bpmToNumber(bpm, "mid")})`;
    } else {
      span.textContent = "";
    }
  });
}
function bpm() {
  let totalBpmMin = (totalBpmMid = totalBpmMax = 0);
  songs.forEach((song) => {
    totalBpmMin += bpmToNumber(song["bpm"], "min");
    totalBpmMid += bpmToNumber(song["bpm"], "mid");
    totalBpmMax += bpmToNumber(song["bpm"], "max");
  });
  writeBpm();

  let spans = tfoot.querySelectorAll(".avg.bpm th span");
  spans[0].textContent = (totalBpmMin / songs.length).toFixed(1);
  spans[1].textContent = (totalBpmMid / songs.length).toFixed(1);
  spans[2].textContent = (totalBpmMax / songs.length).toFixed(1);
}

function writeDate() {
  titleTbody.querySelectorAll("tr.date").forEach((tr, i) => {
    let tds = tr.querySelectorAll("td");
    let category = songs[i]["category"];

    tds[0].textContent = dateFormat.format(songs[i]["date"]["PC"]);
    tds[1].textContent = list["dlcKor"][category];
    tds[1].style.color = getCategoryStyle(category, list["collaboration"]).color;
    tds[1].style.backgroundImage = getCategoryStyle(
      category,
      list["collaboration"]
    ).backgroundImage;
  });
}
function date() {
  dateFormat = new Intl.DateTimeFormat("ko", { year: "numeric", month: "2-digit", day: "2-digit" });
  writeDate();
}

function writeMinLevel() {
  titleTbody.querySelectorAll("tr.minLevel").forEach((tr, i) => {
    tr.querySelectorAll("td").forEach((td, j) => {
      td.textContent = songs[i]["min"][tableHeads["minLevel"][j]];
    });
  });
}
function minLevel() {
  let totalAvg = {};
  tableHeads["minLevel"].forEach((head) => {
    totalAvg[head] = 0;
  });
  songs.forEach((song) => {
    for (let btn in song["min"]) {
      totalAvg[btn] += song["min"][btn];
    }
  });
  for (let btn in totalAvg) {
    totalAvg[btn] = totalAvg[btn] / songs.length;
  }

  writeMinLevel();
  tfoot.querySelectorAll("tr.minLevel th").forEach((th, i) => {
    th.textContent = totalAvg[tableHeads["minLevel"][i]].toFixed(1);
  });
}

function writeMaxLevel() {
  titleTbody.querySelectorAll("tr.maxLevel").forEach((tr, i) => {
    tr.querySelectorAll("td").forEach((td, j) => {
      td.textContent = songs[i]["max"][tableHeads["maxLevel"][j]];
    });
  });
}
function maxLevel() {
  let totalAvg = {};
  tableHeads["maxLevel"].forEach((head) => {
    totalAvg[head] = 0;
  });
  songs.forEach((song) => {
    for (let btn in song["max"]) {
      totalAvg[btn] += song["max"][btn];
    }
  });
  for (let btn in totalAvg) {
    totalAvg[btn] = totalAvg[btn] / songs.length;
  }

  writeMaxLevel();
  tfoot.querySelectorAll("tr.maxLevel th").forEach((th, i) => {
    th.textContent = totalAvg[tableHeads["maxLevel"][i]].toFixed(1);
  });
}

function writeLevels() {
  let btns = commonHeads.slice(1);
  titleTbody.querySelectorAll("tr.levels").forEach((tr, i) => {
    tr.querySelectorAll("td:not([rowspan])").forEach((td, j) => {
      let rank = ranks[j];
      writeLevelsTd(
        rank,
        songs[parseInt(i / 4)]["level"][btns[i % 4]][rank],
        rank in songs[parseInt(i / 4)]["level"][btns[i % 4]],
        td
      );
    });
    if (i % 4 == 0) {
      tr.querySelector("td[rowspan]").textContent =
        list["dlcKor"][songs[parseInt(i / 4)]["category"]];
    }
  });
}
function writeLevelsSort() {
  levelsTbody.querySelectorAll("tr").forEach((tr, i) => {
    let btn = levelsSortBtn;
    tr.hidden = !(i < levelList[btn].length);

    if (i < levelList[btn].length) {
      tr.querySelector("th").textContent = levelList[btn][i]["title"];
      tr.querySelectorAll("td").forEach((td, j) => {
        writeLevelsTd(
          ranks[j],
          levelList[btn][i]["level"],
          levelList[btn][i]["rank"] == ranks[j],
          td
        );
      });
    }
  });
}
function levels() {
  writeLevels();
  writeLevelsSort();
}
function writeLevelsTd(rank, level, condition, td) {
  if (condition) {
    let span = document.createElement("span");
    span.className = `${rank == "SC" ? "SC" : level <= 5 ? "NM" : level <= 10 ? "HD" : "MX"}-color`;
    span.textContent = "★";
    td.textContent = level;
    td.prepend(span);
  } else {
    td.textContent = "　";
  }
}

function writeNotes() {
  let btns = commonHeads.slice(1);
  titleTbody.querySelectorAll("tr.notes").forEach((tr, i) => {
    tr.querySelectorAll("td:not([rowspan])").forEach((td, j) => {
      let rank = ranks[j];
      td.textContent =
        rank in songs[parseInt(i / 4)]["note"][btns[i % 4]]
          ? songs[parseInt(i / 4)]["note"][btns[i % 4]][rank]
          : "　";
    });
    if (i % 4 == 0) {
      tr.querySelector("td[rowspan]").textContent =
        list["dlcKor"][songs[parseInt(i / 4)]["category"]];
    }
  });
}
function notes() {
  writeNotes();
}

function sortSong(sortCategory, head, sortMode) {
  switch (sortCategory) {
    case "firstColumn":
      if (mode == "levels" && isLevelsSort) {
        switch (sortMode) {
          case ASC:
            levelList[levelsSortBtn].sort((a, b) => {
              if (a["title"] == b["title"]) {
                return ranks.indexOf(a["rank"]) - ranks.indexOf(b["rank"]);
              }
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            });
            break;
          case DES:
            levelList[levelsSortBtn].sort((a, b) => {
              if (a["title"] == b["title"]) {
                return ranks.indexOf(a["rank"]) - ranks.indexOf(b["rank"]);
              }
              return b["title"].toLowerCase().localeCompare(a["title"].toLowerCase());
            });
            break;
        }
        writeLevelsSort();
      } else {
        switch (sortMode) {
          case ASC:
            songs.sort((a, b) => a["title"].toLowerCase().localeCompare(b["title"].toLowerCase()));
            break;
          case DES:
            songs.sort((a, b) => b["title"].toLowerCase().localeCompare(a["title"].toLowerCase()));
            break;
        }
        writeTable();
      }
      break;
    case "levelAvg":
      switch (sortMode) {
        case ASC:
          if (titleMode == "title") {
            songs.sort((a, b) => {
              if (a["avg"][head] == b["avg"][head]) {
                return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
              }
              return a["avg"][head] - b["avg"][head];
            });
          } else if (titleMode == "category") {
            categoryData.sort((a, b) => {
              if (a["avg"][head] == b["avg"][head]) {
                return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
              }
              return a["avg"][head] - b["avg"][head];
            });
          }
          break;
        case DES:
          if (titleMode == "title") {
            songs.sort((a, b) => {
              if (a["avg"][head] == b["avg"][head]) {
                return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
              }
              return b["avg"][head] - a["avg"][head];
            });
          } else if (titleMode == "category") {
            categoryData.sort((a, b) => {
              if (a["avg"][head] == b["avg"][head]) {
                return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
              }
              return b["avg"][head] - a["avg"][head];
            });
          }
          break;
      }
      if (titleMode == "title") {
        writeTable();
      } else if (titleMode == "category") {
        writeTableCategory();
      }
      break;
    case "patternCount":
      if (head == "SC 비율") {
        switch (sortMode) {
          case ASC:
            categoryData.sort((a, b) => {
              if (a["SCpercent"] == b["SCpercent"]) {
                return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
              }
              return a["SCpercent"] - b["SCpercent"];
            });
            break;
          case DES:
            categoryData.sort((a, b) => {
              if (a["SCpercent"] == b["SCpercent"]) {
                return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
              }
              return b["SCpercent"] - a["SCpercent"];
            });
            break;
        }
        writeTableCategory();
      } else {
        switch (sortMode) {
          case ASC:
            if (titleMode == "title") {
              songs.sort((a, b) => {
                if (a["patternCount"][head] == b["patternCount"][head]) {
                  return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
                }
                return a["patternCount"][head] - b["patternCount"][head];
              });
            } else if (titleMode == "category") {
              categoryData.sort((a, b) => {
                if (a["patternCount"][head] == b["patternCount"][head]) {
                  return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
                }
                return a["patternCount"][head] - b["patternCount"][head];
              });
            }
            break;
          case DES:
            if (titleMode == "title") {
              songs.sort((a, b) => {
                if (a["patternCount"][head] == b["patternCount"][head]) {
                  return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
                }
                return b["patternCount"][head] - a["patternCount"][head];
              });
            } else if (titleMode == "category") {
              categoryData.sort((a, b) => {
                if (a["patternCount"][head] == b["patternCount"][head]) {
                  return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
                }
                return b["patternCount"][head] - a["patternCount"][head];
              });
            }
            break;
        }
        if (titleMode == "title") {
          writeTable();
        } else if (titleMode == "category") {
          writeTableCategory();
        }
      }
      break;
    case "patternCountAvg":
      switch (sortMode) {
        case ASC:
          categoryData.sort((a, b) => {
            if (a["patternCountAvg"][head] == b["patternCountAvg"][head]) {
              return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
            }
            return a["patternCountAvg"][head] - b["patternCountAvg"][head];
          });
          break;
        case DES:
          categoryData.sort((a, b) => {
            if (a["patternCountAvg"][head] == b["patternCountAvg"][head]) {
              return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
            }
            return b["patternCountAvg"][head] - a["patternCountAvg"][head];
          });
          break;
      }
      writeTableCategory();
      break;
    case "length":
      switch (sortMode) {
        case ASC:
          songs.sort((a, b) => {
            if (a["length"] == b["length"]) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return a["length"] - b["length"];
          });
          break;
        case DES:
          songs.sort((a, b) => {
            if (a["length"] == b["length"]) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return b["length"] - a["length"];
          });
          break;
      }
      writeTable();
      break;
    case "bpm":
      switch (sortMode) {
        case ASC:
          songs.sort((a, b) => {
            if (bpmToNumber(a["bpm"], bpmMode) == bpmToNumber(b["bpm"], bpmMode)) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return bpmToNumber(a["bpm"], bpmMode) - bpmToNumber(b["bpm"], bpmMode);
          });
          break;
        case DES:
          songs.sort((a, b) => {
            if (bpmToNumber(a["bpm"], bpmMode) == bpmToNumber(b["bpm"], bpmMode)) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return bpmToNumber(b["bpm"], bpmMode) - bpmToNumber(a["bpm"], bpmMode);
          });
          break;
      }
      writeTable();
      break;
    case "date":
      switch (sortMode) {
        case ASC:
          songs.sort((a, b) => {
            if (a["date"]["PC"].valueOf() == b["date"]["PC"].valueOf()) {
              if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
                return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
              }
              return categoryList.indexOf(a["category"]) - categoryList.indexOf(b["category"]);
            }
            return a["date"]["PC"].valueOf() - b["date"]["PC"].valueOf();
          });
          break;
        case DES:
          songs.sort((a, b) => {
            if (a["date"]["PC"].valueOf() == b["date"]["PC"].valueOf()) {
              if (categoryList.indexOf(a["category"]) == categoryList.indexOf(b["category"])) {
                return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
              }
              return categoryList.indexOf(b["category"]) - categoryList.indexOf(a["category"]);
            }
            return b["date"]["PC"].valueOf() - a["date"]["PC"].valueOf();
          });
          break;
      }
      writeTable();
      break;
    case "minLevel":
      switch (sortMode) {
        case ASC:
          songs.sort((a, b) => {
            if (a["min"][head] == b["min"][head]) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return a["min"][head] - b["min"][head];
          });
          break;
        case DES:
          songs.sort((a, b) => {
            if (a["min"][head] == b["min"][head]) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return b["min"][head] - a["min"][head];
          });
          break;
      }
      writeTable();
      break;
    case "maxLevel":
      switch (sortMode) {
        case ASC:
          songs.sort((a, b) => {
            if (a["max"][head] == b["max"][head]) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return a["max"][head] - b["max"][head];
          });
          break;
        case DES:
          songs.sort((a, b) => {
            if (a["max"][head] == b["max"][head]) {
              return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
            }
            return b["max"][head] - a["max"][head];
          });
          break;
      }
      writeTable();
      break;
    case "levels":
      switch (sortMode) {
        case ASC:
          levelList[levelsSortBtn].sort((a, b) => {
            if (a["level"] == b["level"]) {
              if (a["rank"] == b["rank"]) {
                return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
              }
              return ranks.indexOf(a["rank"]) - ranks.indexOf(b["rank"]);
            }
            return a["level"] - b["level"];
          });
          break;
        case DES:
          levelList[levelsSortBtn].sort((a, b) => {
            if (a["level"] == b["level"]) {
              if (a["rank"] == b["rank"]) {
                return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
              }
              return ranks.indexOf(b["rank"]) - ranks.indexOf(a["rank"]);
            }
            return b["level"] - a["level"];
          });
          break;
      }
      writeLevelsSort();
      break;
  }
}

function writeTitle() {
  titleTbody.querySelectorAll("th.title").forEach((th, i) => {
    th.lastChild.textContent = songs[i]["uniqueTitle"];
    th.querySelector("img").src = `${songs[i]["urlTitle"]}_1.png`;
  });
}
function writeTable() {
  writeTitle();
  writeLevelAvg();
  writePatternCount();
  writeLength();
  writeBpm();
  writeDate();
  writeMinLevel();
  writeMaxLevel();
  writeLevels();
  writeNotes();
}

function writeCategory() {
  categoryTbody.querySelectorAll("th.category").forEach((th, i) => {
    let category = categoryData[i]["category"];
    th.textContent = list["dlcKor"][category];
    th.style.color = getCategoryStyle(category, list["collaboration"]).color;
    th.style.backgroundImage = getCategoryStyle(category, list["collaboration"]).backgroundImage;
  });
}
function writeTableCategory() {
  writeCategory();
  writeLevelAvgCategory();
  writePatternCountCategory();
  writePatternCountAvg();
}

function histogramInit() {
  let tbody = histogramTable.querySelector("tbody");
  for (let i = MIN_LEVEL; i <= MAX_LEVEL; i++) {
    let template = document.querySelector("#histogramTemplate").content.cloneNode(true);
    let tr = template.firstElementChild;
    tr.dataset.level = i;
    template.querySelector("th").textContent = i;
    tbody.append(tr);
  }
}

function histogram() {
  levelCount = [];
  for (let i = MIN_LEVEL; i <= MAX_LEVEL; i++) {
    levelCount[i - 1] = { level: i };
    commonHeads.forEach((head) => {
      levelCount[i - 1][head] = 0;
    });
  }
  songs.forEach((song) => {
    for (let level in song["levelCount"]) {
      for (let btn in song["levelCount"][level]) {
        let count = song["levelCount"][level][btn];
        levelCount[level - 1][btn] += count;
      }
    }
  });
  histogramTable.querySelectorAll("tbody tr").forEach((tr, i) => {
    tr.querySelectorAll("td").forEach((td, j) => {
      td.textContent = levelCount[i][commonHeads[j]];
    });
  });

  drawGraph(
    "histogram",
    Array.from({ length: MAX_LEVEL }, (_, i) => i + 1),
    commonHeads.map((head) => Object.values(levelCount).map((a) => a[head]))
  );
}

function histogramWriteTable() {
  let tbody = histogramTable.querySelector("tbody");
  levelCount.forEach((lc) => {
    tbody.append(tbody.querySelector(`tr[data-level='${lc["level"]}']`));
  });
}

function sortHistogram(head, sortMode) {
  if (head == "레벨") {
    switch (sortMode) {
      case ASC:
        levelCount.sort((a, b) => a["level"] - b["level"]);
        break;
      case DES:
        levelCount.sort((a, b) => b["level"] - a["level"]);
        break;
    }
  } else {
    switch (sortMode) {
      case ASC:
        levelCount.sort((a, b) => {
          if (a[head] == b[head]) {
            return a["level"] - b["level"];
          }
          return a[head] - b[head];
        });
        break;
      case DES:
        levelCount.sort((a, b) => {
          if (a[head] == b[head]) {
            return a["level"] - b["level"];
          }
          return b[head] - a[head];
        });
        break;
    }
  }
  histogramWriteTable();
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

function drawGraph(mode, x, y) {
  commonHeads.forEach((head, i) => {
    var trace = {
      x,
      y: y[i],
      type: "bar",
      // text: y[i].map(String),
      marker: {
        line: {
          width: 1.5,
        },
      },
    };
    var data = [trace];
    var layout = {
      title: head,
      xaxis: {
        dtick: 1,
      },
    };
    Plotly.newPlot(`${mode}_${head}`, data, layout, { staticPlot: true, responsive: true });
  });
}
