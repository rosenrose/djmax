const [baseWidth, baseHeight] = [1920, 1080];
const [cropSingleWidth, cropSingleHeight, cropSingleX, cropSingleY] = [740, 934, 590, 0];
const [cropDetailsWidth, cropDetailsHeight, cropDetailsX, cropDetailsY] = [380, 680, 0, 210];
const detailsOffsetY = 120;
const [cropMultiWidth, cropMultiHeight, cropMultiX, cropMultiY] = [1204, 924, 0, 0];

const [coverWidth, coverHeight] = [120, 60];
const [coverSingleX, coverSingleY] = [307, 850];
const [coverMulti2X, coverMulti2Y] = [396, 120];
const coverMulti3XY = [
  [276, 120],
  [866, 121],
  [866, 563],
];
Object.freeze(coverMulti3XY);
coverMulti3XY.forEach((coord) => {
  Object.freeze(coord);
});

canvas = document.querySelector("#output");
ctx = canvas.getContext("2d");
resizeCanvas = document.querySelector("#resize");
resizeCtx = resizeCanvas.getContext("2d");
[resizeCanvas.width, resizeCanvas.height] = [baseWidth, baseHeight];
inputFile = document.querySelector("#inputFile");
merge = document.querySelector("#merge");
details = document.querySelector("#details");

files = [];
saves = new Map();

inputFile.addEventListener("change", (event) => {
  saves.clear();
  files = [...event.target.files];
  if (files.length) {
    writeResult();
  }
});

document.addEventListener("paste", (event) => {
  let data = event.clipboardData || window.clipboardData;
  if (select == "inputSingle" && is_merge) {
    files = [...files, ...data.files];
  } else {
    files = [...data.files];
  }
  saves.clear();
  if (files.length) {
    writeResult();
  }
});

document.querySelector("#result").addEventListener("change", (event) => {
  if (event.target.type == "radio") {
    select = event.target.value;

    toggleInput(merge, select == "inputSingle");
    toggleInput(details, select == "inputSingle");
    document.querySelector("#coverNum").hidden = select != "inputMulti3" || !is_cover;

    if (select == "inputSingle" && details.checked) {
      details.dispatchEvent(new InputEvent("change"));
    }
    if (files.length) {
      writeResult();
    }
  }
});

merge.addEventListener("change", (event) => {
  is_merge = event.target.checked;
  inputFile.multiple = event.target.checked;
});

details.addEventListener("change", (event) => {
  is_detail = event.target.checked;

  toggleInput(merge, !event.target.checked);
  merge.dispatchEvent(new InputEvent("change"));

  if (files.length) {
    writeResult();
  }
});

document.querySelector("#hide").addEventListener("change", (event) => {
  is_cover = event.target.checked;
  if (files.length) {
    if (is_cover) {
      writeCover();
    } else {
      removeCover();
    }
  }
  document.querySelector("#coverNum").hidden = select != "inputMulti3" || !is_cover;
});

document.querySelector("#coverNum").addEventListener("change", (event) => {
  coverNum = parseInt(event.target.value);
  if (files.length) {
    removeCover();
    writeCover();
  }
});

document.querySelector("input[checked]").dispatchEvent(new InputEvent("change", { bubbles: true }));
document.querySelectorAll("#details, #hide, #coverNum").forEach((input) => {
  input.dispatchEvent(new InputEvent("change"));
});

canvas.addEventListener("click", (event) => {
  if (!isCanvasBlank(canvas, ctx)) {
    event.target.toBlob((blob) => {
      let data = [new ClipboardItem({ [blob.type]: blob })];
      navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
        if (result.state == "granted" || result.state == "prompt") {
          navigator.clipboard.write(data).then(() => {
            alert("복사되었습니다.");
          });
        }
      });
    });
  }
});

function writeResult() {
  if (select == "inputSingle") {
    if (files.length > 4) {
      files.length = 4;
    }

    let width = cropSingleWidth;
    if (is_detail) {
      width += cropDetailsWidth;
      [canvas.width, canvas.height] = [width, cropSingleHeight];
    } else {
      switch (files.length) {
        case 1:
          [canvas.width, canvas.height] = [width, cropSingleHeight];
          break;
        case 2:
          [canvas.width, canvas.height] = [width * 2, cropSingleHeight];
          break;
        case 3:
        case 4:
          [canvas.width, canvas.height] = [width * 2, cropSingleHeight * 2];
          break;
      }
    }

    let promises = [];
    for (let i = 0; i < files.length; i++) {
      if (is_detail && i > 0) {
        break;
      }
      let image = new Image();
      image.src = URL.createObjectURL(files[i]);
      promises.push(
        new Promise((resolve) => {
          image.onload = () => {
            let [drawX, drawY] = [0, 0];
            switch (i) {
              case 1:
                drawX += width;
                break;
              case 2:
                if (files.length == 3) {
                  drawX += width / 2;
                }
                drawY += cropSingleHeight;
                break;
              case 3:
                drawX += width;
                drawY += cropSingleHeight;
                break;
            }
            let targetImage = image;
            if (image.width != baseWidth || image.height != baseHeight) {
              resizeCtx.drawImage(
                image,
                0,
                0,
                image.width,
                image.height,
                0,
                0,
                baseWidth,
                baseHeight
              );
              targetImage = resizeCanvas;
            }
            ctx.drawImage(
              targetImage,
              cropSingleX,
              cropSingleY,
              width,
              cropSingleHeight,
              drawX,
              drawY,
              width,
              cropSingleHeight
            );
            if (is_detail) {
              ctx.drawImage(
                targetImage,
                cropDetailsX,
                cropDetailsY,
                cropDetailsWidth,
                cropDetailsHeight,
                drawX + cropSingleWidth,
                drawY + detailsOffsetY,
                cropDetailsWidth,
                cropDetailsHeight
              );
            }
            resolve();
          };
        })
      );
    }
    Promise.all(promises).then(() => {
      if (is_cover) {
        writeCover();
      }
      drawWatermark();
    });
  } else {
    [canvas.width, canvas.height] = [cropMultiWidth, cropMultiHeight];
    let image = new Image();
    image.src = URL.createObjectURL(files[0]);
    image.onload = () => {
      if (image.width == baseWidth && image.height == baseHeight) {
        ctx.drawImage(
          image,
          cropMultiX,
          cropMultiY,
          cropMultiWidth,
          cropMultiHeight,
          0,
          0,
          cropMultiWidth,
          cropMultiHeight
        );
      } else {
        resizeCtx.drawImage(image, 0, 0, image.width, image.height, 0, 0, baseWidth, baseHeight);
        ctx.drawImage(
          resizeCanvas,
          cropMultiX,
          cropMultiY,
          cropMultiWidth,
          cropMultiHeight,
          0,
          0,
          cropMultiWidth,
          cropMultiHeight
        );
      }
      if (is_cover) {
        writeCover();
      }
      drawWatermark();
    };
  }
}

function writeCover() {
  switch (select) {
    case "inputSingle":
      let width = cropSingleWidth;
      if (is_detail) {
        width += cropDetailsWidth;
      }

      drawCover(coverSingleX, coverSingleY, coverWidth, coverHeight);
      if (files.length >= 2) {
        drawCover(coverSingleX + width, coverSingleY, coverWidth, coverHeight);
      }
      if (files.length >= 3) {
        if (files.length == 3) {
          drawCover(
            coverSingleX + width / 2,
            coverSingleY + cropSingleHeight,
            coverWidth,
            coverHeight
          );
        } else {
          drawCover(coverSingleX, coverSingleY + cropSingleHeight, coverWidth, coverHeight);
        }
      }
      if (files.length == 4) {
        drawCover(coverSingleX + width, coverSingleY + cropSingleHeight, coverWidth, coverHeight);
      }
      break;
    case "inputMulti2":
      drawCover(coverMulti2X, coverMulti2Y, coverWidth, coverHeight);
      break;
    case "inputMulti3":
      for (let i = 0; i < coverNum; i++) {
        drawCover(coverMulti3XY[i][0], coverMulti3XY[i][1], coverWidth, coverHeight);
      }
      break;
  }
}

function drawCover(x, y, w, h, noSave = false) {
  let cover = ctx.getImageData(x, y, w, h);

  if (!noSave) {
    let save = ctx.createImageData(cover);
    for (let i = 0; i < cover.data.length; i++) {
      save.data[i] = cover.data[i];
    }
    saves.set([x, y], save);
  }

  for (let i = 0; i < cover.data.length; i += 4) {
    [cover.data[i], cover.data[i + 1], cover.data[i + 2]] = [255, 255, 255];
  }
  ctx.putImageData(cover, x, y);
}

function drawWatermark() {
  let watermark = "https://rosenrose.github.io/djmax";
  ctx.font = "1em Helvetica";
  let [textWidth, textHeight] = [
    Math.round(ctx.measureText(watermark).width),
    parseInt(ctx.font.match(/\d+/)[0]),
  ];
  let margin = 5;
  let [w, h] = [textWidth + margin, textHeight + margin];
  let [x, y] = [canvas.width - w, canvas.height - h];

  drawCover(x, y, w, h, true);
  ctx.fillText(watermark, Math.floor(x + margin / 2), canvas.height - margin); //텍스트 렌더 위치는 이미지랑 다름
}

function removeCover() {
  saves.forEach((save, [x, y]) => {
    ctx.putImageData(save, x, y);
  });
  saves.clear();
}

function isCanvasBlank(canvas, ctx) {
  let pixelBuffer = new Uint32Array(
    ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );
  return pixelBuffer.every((color) => color === 0);
}
