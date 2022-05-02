const songSelect = {};
const itemContainer = document.querySelector("#itemContainer");
const runBtn = document.querySelector("#run");
const resultCount = document.querySelector("#resultCountInput");
const shareBtn = document.querySelector("#shareBtn");
const cloud = "https://d2wwh0934dzo2k.cloudfront.net/djmax/cut/";
const WEBP_WIDTH = 720;
const GIF_WIDTH = 360;
const PAD_LENGTH = 4;

fetch("../db.json")
  .then((response) => response.json())
  .then((json) => {
    dlcKor = json["dlcKor"];
    return fetch("id_list.json");
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

document.querySelector("#webpSelect").addEventListener("change", (event) => {
  if (event.target.name == "cutMode") {
    cutMode = event.target.value;
    toggleAttribute(
      "style.display",
      cutMode == "jpg" ? "none" : "",
      document.querySelector("#webpOption")
    );
    toggleAttribute("hidden", cutMode == "webp", shareBtn);

    if (cutMode == "jpg") {
      resultCount.max = 12;
    } else {
      resultCount.max = 4;
      resultCount.value = 1;
    }
    resultCount.dispatchEvent(new InputEvent("input", { bubbles: true }));
    resultCount.previousElementSibling.textContent = `개수(1~${resultCount.max}): `;
  } else if (event.target.name == "webpFormat") {
    webpFormat = event.target.value;
  }
});
document.querySelector("input[type='range']").addEventListener("input", (event) => {
  duration = parseInt(event.target.value);
  seconds = duration / 12;
  event.target.nextElementSibling.textContent = `${
    Number.isInteger(seconds) ? seconds : seconds.toFixed(1)
  }초`;
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
    let randCut;

    if (cutMode == "jpg") {
      randCut = randomInt(1, parseInt(cut) + 1);
      itemImg.src = `https://d2wwh0934dzo2k.cloudfront.net/djmax/cut/${id}/${randCut
        .toString()
        .padStart(PAD_LENGTH, "0")}.jpg`;
      link.href = `https://youtu.be/${id}`;
    } else if (cutMode == "webp") {
      randCut = randomInt(1, parseInt(cut) + 1 - duration);
      try {
        getWebp(
          {
            title: id,
            name,
            cut: randCut,
            duration,
            webpFormat,
            cloud,
            WEBP_WIDTH,
            GIF_WIDTH,
            PAD_LENGTH,
          },
          itemTemplate.firstElementChild
        );
      } catch (err) {
        console.log(err);
        caption.textContent = "전송 실패";
      }
    }

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
    if (cutMode == "jpg") {
      shareBtn.hidden = false;
    }
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

resultCount.addEventListener("input", () => {
  count = Math.min(parseInt(resultCount.value), parseInt(resultCount.max));
  if (isNaN(count)) {
    count = 0;
  }
  resultCount.value = count;
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

document.querySelectorAll("input[type='radio'][checked]").forEach((input) => {
  input.dispatchEvent(new InputEvent("change", { bubbles: true }));
});
document
  .querySelector("input[type='range']")
  .dispatchEvent(new InputEvent("input", { bubbles: true }));

function toggleRunbtn() {
  runBtn.classList.toggle("click");
  runBtn.classList.toggle("gray");
}

function getWebp(params, item) {
  const { name, cut, duration, webpFormat } = params;
  const img = item.querySelector(".itemImg");
  const caption = item.querySelector("figcaption");
  const bar = item.querySelector("progress");
  const link = item.querySelector("a");

  caption.textContent = `0/${duration} 다운로드`;
  bar.max = duration * 2;
  bar.value = 0;
  bar.hidden = false;

  const lastCut = cut + duration - 1;
  const outputName = `${name}_${cut.toString().padStart(PAD_LENGTH, "0")}-${lastCut
    .toString()
    .padStart(PAD_LENGTH, "0")}.${webpFormat}`;
  link.download = outputName;

  if (img.getAttribute("src")) {
    URL.revokeObjectURL(img.src);
    img.src = "";
  }

  // const socket = io("ws://localhost:3000/");
  const socket = io("wss://webp-cloudrun-osuiaeahvq-an.a.run.app/");
  let buffer = [];

  socket.emit("webp", params, () => {
    createWebp({ buffer, img, link, caption, bar, webpFormat });
  });
  socket.on("progress", (progress) => {
    // console.log("server", progress);
    showProgress(caption, bar, progress);
  });
  socket.on("download", (count) => {
    showDownload(caption, bar, duration, count);
  });
  socket.on("transfer", (chunk) => {
    // console.log(chunk);
    buffer.push(chunk);
  });
}

function showProgress(caption, bar, progress) {
  if ("frame" in progress) {
    // const { frame, time, speed } = progress;
    const frame = parseInt(progress.frame);
    caption.textContent = `${((frame / (bar.max / 2)) * 100).toFixed(1)}% / frame=${frame}`;
    bar.value = bar.max / 2 + parseInt(frame);
  } else {
    if (!progress.ratio || !progress.time) {
      return;
    }
    caption.textContent = `${(progress.ratio * 100).toFixed(1)}% / ${
      progress.time?.toFixed(2) || 0
    }s`;
    bar.value = bar.max / 2 + Math.round((bar.max / 2) * progress.ratio);
  }
}

function showDownload(caption, bar, duration, count) {
  caption.textContent = `${count}/${duration} 다운로드`;
  bar.value += 1;
}

function createWebp(props) {
  const { buffer, img, link, caption, bar, webpFormat } = props;
  const blob = new Blob(buffer, { type: `image/${webpFormat}` });
  const uri = URL.createObjectURL(blob);

  img.src = uri;
  link.href = uri;

  let size = blob.size / 1024;
  if (size > 1000) {
    size /= 1024;
    size = `${size.toFixed(1)}MB`;
  } else {
    size = `${size.toFixed(1)}KB`;
  }

  caption.textContent = size;
  bar.hidden = true;
}
