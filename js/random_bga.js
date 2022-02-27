const dlcSelect = new Set();
const songSelect = new Set();
const itemContainer = document.querySelector("#itemContainer");
const runBtn = document.querySelector("#run");
const resultCount = document.querySelector("#resultCountInput");
const maxCount = parseInt(resultCount.max);

fetch("../list.json")
  .then((response) => response.json())
  .then((json) => {
    dlcKor = json["dlcKor"];
    return fetch("list.json");
  })
  .then((response) => response.json())
  .then((json) => {
    list = json;
    idMap = Object.values(list).reduce((a, b) => {
      return { ...a, ...b };
    });
    const dlcCheck = document.querySelector("#dlcCheckbox");

    for (dlc in list) {
      const template = document.querySelector("#dlcCheckboxTemplate").content.cloneNode(true);
      const label = template.firstElementChild;
      const input = template.querySelector("input");
      const details = template.querySelector("details");

      label.id = dlc;
      label.classList.add("dlcLabel");
      input.value = dlc;
      details.querySelector("summary").textContent = dlc === "hidden" ? "히든" : dlcKor[dlc];

      for (id in list[dlc]) {
        const template = document.querySelector("#dlcCheckboxTemplate").content.cloneNode(true);
        const label = template.firstElementChild;
        const input = template.querySelector("input");
        template.querySelector("details").remove();

        label.classList.add("songLabel");
        label.classList.remove("bold");
        input.value = id;
        label.append(list[dlc][id]["name"]);
        details.append(template.firstElementChild);
      }
      dlcCheck.append(label);
    }

    document.querySelectorAll(".dlcLabel > input").forEach((check) => {
      check.click();
    });
    resultCount.dispatchEvent(new InputEvent("input"));
  });

document.querySelector("#spread").addEventListener("click", () => {
  document.querySelectorAll(".dlcLabel > input").forEach((input) => {
    if (!input.checked) {
      input.click();
    }
  });
});
document.querySelector("#collapse").addEventListener("click", () => {
  document.querySelectorAll(".dlcLabel > input").forEach((input) => {
    if (input.checked) {
      input.click();
    }
  });
});

document.querySelector("#dlcSelect").addEventListener("change", (event) => {
  if (event.target.matches("details, summary")) {
    return;
  }

  const label = event.target.closest("label");

  if (label.matches(".dlcLabel")) {
    if (event.target.checked) {
      dlcSelect.add(event.target.value);
    } else {
      dlcSelect.delete(event.target.value);
    }
    label.querySelectorAll(".songLabel input").forEach((input) => {
      input.checked = event.target.checked;
      input.dispatchEvent(new InputEvent("change", { bubbles: true }));
    });
  } else if (label.matches(".songLabel")) {
    const dlcInput = label.closest("details").previousElementSibling;
    const dlc = dlcInput.value;
    const songInputs = [...label.parentNode.querySelectorAll("input")];

    dlcInput.indeterminate = !(
      songInputs.every((input) => input.checked) || songInputs.every((input) => !input.checked)
    );

    songInputs.forEach((input) => {
      songId = input.value;

      if (dlcInput.indeterminate) {
        if (input.checked) {
          songSelect.add(songId);
        } else {
          songSelect.delete(songId);
        }
        dlcSelect.delete(dlc);
      } else {
        songSelect.delete(songId);
        if (dlcInput.checked) {
          dlcSelect.add(dlc);
        } else {
          dlcSelect.delete(dlc);
        }
      }
    });
  }
});

runBtn.addEventListener("click", () => {
  let songMap = [...dlcSelect]
    .map((dlc) => list[dlc])
    .reduce((a, b) => {
      return { ...a, ...b };
    }, {});
  songSelect.forEach((id) => {
    songMap = { ...songMap, ...{ [id]: idMap[id] } };
  });
  console.log(dlcSelect, songSelect);
  // console.log(songMap);
  songList = Object.entries(songMap);

  if (!runBtn.matches(".click") || songList.length < 1) {
    return;
  }

  runBtn.dispatchEvent(new MouseEvent("mouseenter"));
  setTimeout(() => {
    toggleRunbtn();
  });

  itemContainer.replaceChildren();

  const promsies = [];
  for (let i = 0; i < count; i++) {
    const rand = randomInt(0, songList.length);
    const [id, { name, cut }] = songList[rand];
    const itemTemplate = document.querySelector("#itemTemplate").content.cloneNode(true);
    const [loading, itemImg] = itemTemplate.querySelectorAll("img");
    const link = itemTemplate.querySelector("a");
    const caption = itemTemplate.querySelector("figcaption");
    const randCut = randomInt(1, parseInt(cut) + 1)
      .toString()
      .padStart(4, "0");

    itemImg.src = `https://d2l1b145ht03q6.cloudfront.net/djmax/bga/${id}/${randCut}.jpg`;
    link.href = `https://youtu.be/${id}`;
    promsies.push(
      new Promise((resolve) => {
        itemImg.addEventListener("load", () => {
          loading.hidden = true;
          caption.textContent = name;
          resolve();
        });
      })
    );
    itemContainer.append(itemTemplate.firstElementChild);
  }

  Promise.all(promsies).then(() => {
    toggleRunbtn();
    runBtn.src = "../img/btn_ready.png";
  });
});

runBtn.addEventListener("mouseenter", () => {
  if (runBtn.matches(".click")) {
    runBtn.src = "../img/btn_press.png";
  }
});
runBtn.addEventListener("mouseleave", () => {
  if (runBtn.matches(".click")) {
    runBtn.src = "../img/btn_ready.png";
  }
});

resultCount.addEventListener("input", (event) => {
  count = Math.min(parseInt(event.target.value), maxCount);
  if (isNaN(count)) {
    count = 0;
  }
  event.target.value = count;
});

function toggleRunbtn() {
  runBtn.classList.toggle("click");
  runBtn.classList.toggle("gray");
}
