dlcSelect = new Set();
btnSelect = new Set();
rankSelect = new Set();
rands = new Set();
levelLimit = 0;
levelLimit2 = 0;
count = 10;
const maxCount = 10;

fetch("../db.json")
  .then((response) => response.json())
  .then((json) => {
    list = json;
    for (let category in list["songs"]) {
      list["songs"][category] = list["songs"][category].map((song) => new Song(song));
    }
    songs = Object.values(list["songs"]).flat();
    document.querySelector("#run").textContent = "뽑기";
    document.querySelector("#run").disabled = false;

    let dlcCheck = document.querySelector("#dlcCheckbox");

    Object.keys(list["songs"]).forEach((dlc) => {
      let template = document.querySelector("#dlcCheckboxTemplate").content.cloneNode(true);
      let label = template.firstElementChild;
      let input = template.querySelector("input");

      input.value = dlc;
      input.nextSibling.textContent = list["dlcKor"][dlc];
      dlcCheck.append(label);
    });

    document.querySelectorAll("input[checked], select").forEach((input) => {
      input.dispatchEvent(new InputEvent("change", { bubbles: true }));
    });
    document
      .querySelectorAll("#dlcSelect input, #buttonSelect input, #rankSelect input")
      .forEach((check) => {
        check.click();
      });
  });

let ol = document.querySelector("#randomResult");
for (let i = 0; i < maxCount; i++) {
  let template = document.querySelector("#songTemplate").content.cloneNode(true);
  ol.append(template.firstElementChild);
}

document.querySelector("#modeSelect").addEventListener("change", (event) => {
  mode = event.target.value;
  toggleAttribute(
    "style.display",
    mode == "PC" ? "" : "none",
    document.querySelector("input[value='SC']").parentNode,
    document.querySelector("input[value='nexon']").parentNode,
    document.querySelector("input[value='musedash']").parentNode,
    document.querySelector("input[value='ez2on']").parentNode,
    document.querySelector("input[value='maplestory']").parentNode,
    document.querySelector("input[value='clearpass']").parentNode
  );

  if (mode == "PC") {
    if (document.querySelector("input[value='SC']").checked) {
      rankSelect.add("SC");
    }
    if (document.querySelector("input[value='nexon']").checked) {
      dlcSelect.add("nexon");
    }
    if (document.querySelector("input[value='musedash']").checked) {
      dlcSelect.add("musedash");
    }
    if (document.querySelector("input[value='ez2on']").checked) {
      dlcSelect.add("ez2on");
    }
    if (document.querySelector("input[value='maplestory']").checked) {
      dlcSelect.add("maplestory");
    }
    if (document.querySelector("input[value='clearpass']").checked) {
      dlcSelect.add("clearpass");
    }
  } else if (mode == "PS4") {
    rankSelect.delete("SC");
    dlcSelect.delete("nexon");
    dlcSelect.delete("musedash");
    dlcSelect.delete("ez2on");
    dlcSelect.delete("maplestory");
    dlcSelect.delete("clearpass");
  }
});

document.querySelector("#dlcSelect").addEventListener("change", (event) => {
  if (event.target.checked) {
    dlcSelect.add(event.target.value);
  } else {
    dlcSelect.delete(event.target.value);
  }
});

document.querySelector("#spread").addEventListener("click", () => {
  document.querySelectorAll("#dlcCheckbox input").forEach((input) => {
    if (!input.checked) {
      input.click();
    }
  });
});
document.querySelector("#collapse").addEventListener("click", () => {
  document.querySelectorAll("#dlcCheckbox input").forEach((input) => {
    if (input.checked) {
      input.click();
    }
  });
});

document.querySelector("#buttonSelect").addEventListener("change", (event) => {
  if (event.target.checked) {
    btnSelect.add(event.target.value);
  } else {
    btnSelect.delete(event.target.value);
  }
});
document.querySelector("#rankSelect").addEventListener("change", (event) => {
  if (event.target.checked) {
    rankSelect.add(event.target.value);
  } else {
    rankSelect.delete(event.target.value);
  }
});

let levelCheck = document.querySelector("#levelCheck");
levelCheck.addEventListener("change", () => {
  document.querySelector("#levelSelect > div").toggleAttribute("hidden");
});
document.querySelector("#levelInput").addEventListener("change", (event) => {
  levelLimit = parseInt(event.target.value);
});
document.querySelector("#levelInput2").addEventListener("change", (event) => {
  levelLimit2 = parseInt(event.target.value);
});

document.querySelector("#levelCondition").addEventListener("change", (event) => {
  levelCondition = event.target.value;
  document.querySelector("#range").style.display = levelCondition == "range" ? "" : "none";
});

document.querySelector("#run").addEventListener("click", () => {
  let result = [];
  for (let dlc of dlcSelect) {
    let temp =
      structuredClone?.(list["songs"][dlc]) || JSON.parse(JSON.stringify(list["songs"][dlc]));
    for (let song of temp) {
      song["category"] = dlc;
    }
    result = [...result, ...temp];
  }
  result = result.filter((song) => ("exclusive" in song ? song["exclusive"] == mode : true));
  result = result.filter((song) => {
    for (let btn of btnSelect) {
      for (let rank of rankSelect) {
        if (rank in song["level"][btn]) {
          return true;
        }
      }
    }
    return false;
  });

  if (levelCheck.checked) {
    result = result.filter((song) => {
      let pattern = getPatterns(song["level"], levelLimit, levelLimit2);
      if (pattern.length) {
        song["pattern"] = pattern;
        return true;
      } else {
        return false;
      }
    });
  }
  console.log(result);

  let min = Math.min(count, result.length);
  while (rands.size < min) {
    rands.add(randomInt(0, result.length));
  }

  resultList = [...rands].map((rand) => result[rand]);
  rands.clear();
  if (resultList.length == 0) {
    alert("결과가 없습니다.");
  }
  let li = document.querySelectorAll("#result li");
  for (let i = 0; i < maxCount; i++) {
    li[i].querySelector(".song_pic").src = "";
    let p = li[i].querySelectorAll("p");
    p[0].textContent = "";
    p[1].textContent = "";
    li[i].querySelector(".title_artist").style = "";
  }
  for (let i = 0; i < min; i++) {
    let category = resultList[i]["category"];
    li[i].querySelector(".song_pic").src = `${resultList[i]["urlTitle"]}_${randomInt(1, 6)}.png`;

    let p = li[i].querySelectorAll("p");
    p[0].textContent = resultList[i]["title"];

    if ("pattern" in resultList[i]) {
      let span = document.createElement("span");
      span.textContent = " (";
      span.className = "pattern";
      for (let j = 0; j < resultList[i]["pattern"].length; j++) {
        span.append(resultList[i]["pattern"][j][0] + " ");
        let pattern = document.createElement("span");
        pattern.textContent = resultList[i]["pattern"][j][1];
        pattern.className = resultList[i]["pattern"][j][1];
        span.append(pattern);
        if (j < resultList[i]["pattern"].length - 1) {
          span.append(", ");
        }
      }
      span.append(")");
      p[0].append(span);
    }

    let artist;
    if ("remix" in resultList[i]["artist"]) {
      artist = resultList[i]["artist"]["remix"];
    } else {
      artist = resultList[i]["artist"]["compose"];
    }

    if (Array.isArray(artist)) {
      artist = artist.join(" / ");
    } else if (typeof artist == "object") {
      artist = artist["nominal"];
    }

    p[1].textContent = artist;
    let categoryStyle = getCategoryStyle(category, list["collaboration"]);
    li[i].querySelector(".title_artist").style.color = categoryStyle.color;
    li[i].querySelector(".title_artist").style.backgroundImage = categoryStyle.backgroundImage;
    li[i].querySelector(".title_artist").style.backgroundSize = categoryStyle.backgroundSize;
  }
});

document.querySelector("#resultCountInput").addEventListener("change", (event) => {
  count = parseInt(event.target.value);
});

function getPatterns(level, num, num2) {
  let result = [];
  for (let btn of btnSelect) {
    for (let rank in level[btn]) {
      if (!rankSelect.has(rank)) {
        continue;
      }
      let value = level[btn][rank];
      switch (levelCondition) {
        case "gtr":
          if (value >= num) result.push([btn, rank]);
          break;
        case "lss":
          if (value <= num) result.push([btn, rank]);
          break;
        case "equal":
          if (value == num) result.push([btn, rank]);
          break;
        case "range":
          if (value >= num && value <= num2) result.push([btn, rank]);
          break;
      }
    }
  }
  return result;
}
