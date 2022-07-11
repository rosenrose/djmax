featRegex = /([^()]+)(?:\((.+)\))?/;
artistUl = document.querySelector("#artistUl");
titleUl = document.querySelector("#titleUl");
categoryKorMap = {};
document.querySelectorAll("#selectMode input").forEach((input) => {
  categoryKorMap[input.value] = input.nextSibling.textContent;
});

fetch("../db.json")
  .then((response) => response.json())
  .then((json) => {
    list = json;
    songs = Object.values(json["songs"])
      .flat()
      .sort((a, b) => a["title"].toLowerCase().localeCompare(b["title"].toLowerCase()));

    artists = {};
    songs.forEach((song) => {
      for (let category in song["artist"]) {
        let artist = song["artist"][category];
        if (typeof artist == "string" || Array.isArray(artist)) {
          if (typeof artist == "string") {
            artist = [artist];
          }
          artist.forEach((a) => {
            if (category == "feat") {
              let result = featRegex.exec(a);
              if (result[2]) {
                addArtist(result[1], category, song["title"], result[2]);
              } else {
                addArtist(result[1], category, song["title"], category);
              }
            } else if (category == "visualize") {
              addArtist(a, category, song["title"], category);
            } else {
              addArtist(a, category, song["title"]);
            }
          });
        } else if (typeof artist == "object") {
          if ("nominal" in artist) {
            let extra = artist["alias"] || artist["ambiguous"];
            if (["feat", "visualize"].includes(category)) {
              addArtist(`${artist["nominal"]} (${extra})`, category, song["title"], category);
            } else {
              addArtist(`${artist["nominal"]} (${extra})`, category, song["title"]);
            }
            if ("alias" in artist) {
              if (["feat", "visualize"].includes(category)) {
                addArtist(extra, category, song["title"], category);
              } else {
                addArtist(extra, category, song["title"]);
              }
            }
          } else {
            //visualize
            for (let subCat in artist) {
              let subArtist = artist[subCat];
              if (typeof subArtist == "string") {
                subArtist = [subArtist];
              }
              subArtist.forEach((s) => {
                addArtist(s, category, song["title"], subCat);
              });
            }
          }
        } else {
          throw "error!";
        }
      }
    });
    artists = Object.fromEntries(
      Object.entries(artists).sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()))
    );

    for (let artist in artists) {
      let artistTemplate = document.querySelector("#artistTemplate").content.cloneNode(true);
      let artistLi = artistTemplate.firstElementChild;
      artistTemplate.querySelector("summary").textContent = artist;

      let categoryUl = artistLi.querySelector("ul");
      for (let category in artists[artist]) {
        artistLi.classList.add(category);
        let categoryTemplate = document.querySelector("#categoryTemplate").content.cloneNode(true);
        let categoryLi = categoryTemplate.firstElementChild;
        categoryLi.classList.add(category);
        categoryLi.querySelector("p").textContent = categoryKorMap[category];

        if (["feat", "visualize"].includes(category)) {
          let subCatUl = categoryLi.querySelector("ul");
          subCatUl.className = "subCatUl";
          for (let subCat in artists[artist][category]) {
            let subCatTemplate = document
              .querySelector("#categoryTemplate")
              .content.cloneNode(true);
            let subCatLi = subCatTemplate.firstElementChild;
            subCatLi.className = "subCatLi";
            if (category == "feat" && subCat != "feat") {
              subCatLi.querySelector("p").textContent = subCat;
            } else if (category == "visualize" && subCat != "visualize") {
              subCatLi.querySelector("p").textContent = categoryKorMap[subCat];
            }

            let songUl = subCatLi.querySelector("ul");
            for (let title of artists[artist][category][subCat]) {
              songUl.append(createSongLi(title, artist));
            }

            if (["feat", "visualize"].includes(subCat)) {
              categoryLi.querySelector("ul").before(songUl);
            } else {
              subCatUl.append(subCatLi);
            }
          }
        } else {
          let songUl = categoryLi.querySelector("ul");
          for (let title of artists[artist][category]) {
            songUl.append(createSongLi(title, artist));
          }
        }
        categoryUl.append(categoryLi);
      }
      artistUl.append(artistLi);
    }

    document.querySelector("#selectMode").addEventListener("change", (event) => {
      select = event.target.value;

      selectAttribute(
        `#${select != "title" ? "artistUl" : "titleUl"}`,
        "hidden",
        false,
        true,
        ...document.querySelectorAll("#artistUl, #titleUl")
      );

      if (select == "all") {
        document.querySelectorAll(".artistLi, .categoryLi").forEach((li) => {
          li.hidden = false;
        });
      } else if (select != "title") {
        selectAttribute(
          `.${select}`,
          "hidden",
          false,
          true,
          ...document.querySelectorAll(".artistLi, .categoryLi")
        );
      }
      toggleAttribute(
        "style.listStyleType",
        select == "all" ? "" : "none",
        ...document.querySelectorAll(".categoryLi")
      );
      toggleAttribute("hidden", select != "all", ...document.querySelectorAll(".categoryLi > p"));
      document.querySelector("div#buttons").hidden = select == "title";
    });
    document
      .querySelector("input[checked]")
      .dispatchEvent(new InputEvent("change", { bubbles: true }));

    songs.forEach((song) => {
      let li = createSongLi(song["title"], song["artist"]["compose"]);
      let title = document.createElement("h3");
      title.textContent = li.querySelector("p").textContent;
      li.querySelector("p").replaceWith(title);
      for (let category in song["artist"]) {
        let creditTemplate = document.querySelector("#creditTemplate").content.cloneNode(true);
        let cat = creditTemplate.querySelector(".cat");
        cat.textContent = `${category[0].toUpperCase()}${category.slice(1)}`;
        let art = creditTemplate.querySelector(".art");
        art.textContent = "";

        let artist = song["artist"][category];
        if (typeof artist == "string" || Array.isArray(artist)) {
          if (typeof artist == "string") {
            artist = [artist];
          }
          art.textContent += artist.join(" / ");
        } else if (typeof artist == "object") {
          if ("nominal" in artist) {
            art.textContent += artist["nominal"];
          } else {
            let subArtist = [];
            for (let subCat in artist) {
              if (typeof artist[subCat] == "string") {
                artist[subCat] = [artist[subCat]];
              }
              artist[subCat].forEach((s) => {
                subArtist.push(s);
              });
            }
            art.textContent += subArtist.join(" / ");
          }
        }
        li.querySelector("div").append(creditTemplate.firstElementChild);
      }
      titleUl.append(li);
    });
  });

document.querySelector("#spread").addEventListener("click", () => {
  document.querySelectorAll("details").forEach((details) => {
    details.open = true;
  });
});
document.querySelector("#collapse").addEventListener("click", () => {
  document.querySelectorAll("details").forEach((details) => {
    details.open = false;
  });
});

function addArtist(artist, category, title, subCat) {
  if (!(artist in artists)) {
    artists[artist] = {};
  }
  if (!(category in artists[artist])) {
    if (["feat", "visualize"].includes(category)) {
      artists[artist][category] = {};
    } else {
      artists[artist][category] = [];
    }
  }
  if (["feat", "visualize"].includes(category)) {
    if (!(subCat in artists[artist][category])) {
      artists[artist][category][subCat] = [];
    }
  }

  if (["feat", "visualize"].includes(category)) {
    artists[artist][category][subCat].push(title);
    artists[artist][category][subCat].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  } else {
    artists[artist][category].push(title);
    artists[artist][category].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }
}

function listArtists(song) {
  let artists = new Set();
  for (let category in song["artist"]) {
    let artist = song["artist"][category];
    if (typeof artist == "string" || Array.isArray(artist)) {
      if (typeof artist == "string") {
        artist = [artist];
      }
      artist.forEach((a) => {
        artists.add(a);
      });
    } else if (typeof artist == "object") {
      if ("nominal" in artist) {
        let extra = artist["alias"] || artist["ambiguous"];
        artists.add(`${artist["nominal"]} (${extra})`);
      } else {
        for (let subCat in artist) {
          let subArtist = artist[subCat];
          if (typeof subArtist == "string") {
            subArtist = [subArtist];
          }
          subArtist.forEach((a) => {
            artists.add(a);
          });
        }
      }
    }
  }
  return [...artists];
}

function createSongLi(title, artist) {
  let songTemplate = document.querySelector("#songTemplate").content.cloneNode(true);
  let image = songTemplate.querySelector("img");
  songTemplate.querySelector("p").textContent = title;

  if (typeof artist == "object") {
    if (Array.isArray(artist)) {
      artist = artist[0];
    } else if ("nominal" in artist) {
      artist = artist["nominal"];
    }
  }

  let urlTitle = songs.find(
    (s) => s["title"] == title && listArtists(s).some((a) => a.includes(artist))
  )["urlTitle"];
  image.src = `${urlTitle}_1.png`;
  return songTemplate.firstElementChild;
}
