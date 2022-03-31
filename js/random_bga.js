const songSelect = {};
const itemContainer = document.querySelector("#itemContainer");
const runBtn = document.querySelector("#run");
const resultCount = document.querySelector("#resultCountInput");
const maxCount = parseInt(resultCount.max);
const shareBtn = document.querySelector("#shareBtn");

fetch("../list.json")
  .then((response) => response.json())
  .then((json) => {
    dlcKor = json["dlcKor"];
    return fetch("list.json");
  })
  .then((response) => response.json())
  .then((json) => {
    list = json;
    idMap = Object.values(list).reduce((a, b) => ({ ...a, ...b }));
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

    document.querySelectorAll(".dlcLabel > input").forEach((input) => {
      input.addEventListener("change", (event) => {
        const dlc = event.target.value;
        if (!(dlc in songSelect)) {
          songSelect[dlc] = new Set();
        }

        const checked = event.target.checked;
        const details = event.target.nextElementSibling;
        details.querySelectorAll(".songLabel input").forEach((input) => {
          input.checked = checked;
          input.dispatchEvent(new InputEvent("change"));
        });
      });
    });

    document.querySelectorAll(".songLabel input").forEach((input) => {
      input.addEventListener("change", (event) => {
        const details = event.target.closest("details");
        const dlcInput = details.previousElementSibling;
        const dlc = dlcInput.value;
        const songInputs = [...details.querySelectorAll("input")];

        const allChecked = songInputs.every((input) => input.checked);
        const allUnchecked = songInputs.every((input) => !input.checked);
        dlcInput.indeterminate = !(allChecked || allUnchecked);
        dlcInput.checked = allChecked;

        songInputs.forEach((input) => {
          songId = input.value;
          if (input.checked) {
            songSelect[dlc].add(songId);
          } else {
            songSelect[dlc].delete(songId);
          }
        });
      });
    });

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
    if (input.indeterminate) {
      input.checked = false;
      input.dispatchEvent(new InputEvent("change"));
    }
  });
});

runBtn.addEventListener("click", () => {
  const songList = Object.values(songSelect)
    .reduce((a, b) => [...a, ...b])
    .map((id) => ({ id, ...idMap[id] }));
  // console.log(songList);

  if (!runBtn.matches(".click") || songList.length < 1) {
    return;
  }

  runBtn.dispatchEvent(new MouseEvent("mouseenter"));
  setTimeout(() => {
    toggleRunbtn();
    shareBtn.hidden = true;
  });

  itemContainer.replaceChildren();

  const promsies = [];
  for (let i = 0; i < count; i++) {
    const rand = randomInt(0, songList.length);
    const { id, name, cut } = songList[rand];
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
    shareBtn.hidden = false;
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

shareBtn.addEventListener("click", () => {
  const source = [...document.querySelectorAll("figure.item")]
    .map((item) => {
      const template = document.querySelector("#shareTemplate").content.cloneNode(true);
      const [p1, p2] = template.querySelectorAll("p");

      p1.querySelector("img").src = item.querySelector(".itemImg").src;
      p2.textContent = item.querySelector("figcaption").textContent;

      return template.firstElementChild.innerHTML.trim().replace(/\n\s+/g, "\n");
    })
    .join("\n");

  if (source.length) {
    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      if (result.state == "granted" || result.state == "prompt") {
        navigator.clipboard.writeText(source).then(() => {
          alert("복사되었습니다.");
        });
      }
    });
  }
});

function toggleRunbtn() {
  runBtn.classList.toggle("click");
  runBtn.classList.toggle("gray");
}
