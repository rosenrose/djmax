let categoryKorMap = {
  all: "전체",
  compose: "작곡",
  remix: "리믹스",
  visualize: "BGA",
  vocal: "보컬",
  feat: "피처링",
  lyrics: "작사",
  arrange: "편곡",
  title: "제목",
  illust: "원화",
  motion: "모션",
  background: "배경",
  story: "스토리",
};
let list = {};
let songs = [];
let artists = {};
let featRegex = /([^()]+)(?:\((.+)\))?/;

function App() {
  React.useEffect(() => {
    fetch("../list.json")
      .then((response) => response.json())
      .then((json) => {
        list = json;
        for (let dlc in list["songs"]) {
          list["songs"][dlc] = list["songs"][dlc].map((song) => new Song(song));
        }

        songs = Object.values(json["songs"])
          .reduce((a, b) => [...a, ...b])
          .sort((a, b) => a["title"].toLowerCase().localeCompare(b["title"].toLowerCase()));

        for (let dlc in list["songs"]) {
          list["songs"][dlc].forEach((song) => {
            song["dlc"] = dlc;

            for (let category in song["artist"]) {
              let artist = song["artist"][category];

              if (typeof artist == "string" || Array.isArray(artist)) {
                if (typeof artist == "string") {
                  artist = [artist];
                }

                artist.forEach((a) => {
                  if (typeof a == "object" && "nominal" in a) {
                    if (category == "feat") {
                      let result = featRegex.exec(a["nominal"]);

                      if (result[2]) {
                        addArtistNominal(result[1], category, song, result[2]);
                      } else {
                        addArtistNominal(result[1], category, song, category);
                      }
                    } else if (category == "visualize") {
                      addArtistNominal(a, category, song, category);
                    } else {
                      addArtistNominal(a, category, song, null);
                    }
                  } else {
                    if (category == "feat") {
                      let result = featRegex.exec(a);

                      if (result[2]) {
                        addArtist(result[1], category, song, result[2]);
                      } else {
                        addArtist(result[1], category, song, category);
                      }
                    } else if (category == "visualize") {
                      addArtist(a, category, song, category);
                    } else {
                      addArtist(a, category, song, null);
                    }
                  }
                });
              } else if (typeof artist == "object") {
                if ("nominal" in artist) {
                  addArtistNominal(artist, category, song, null);
                } else {
                  //visualize
                  for (let subCat in artist) {
                    let subArtist = artist[subCat];

                    if (typeof subArtist == "string" || Array.isArray(subArtist)) {
                      if (typeof subArtist == "string") {
                        subArtist = [subArtist];
                      }

                      subArtist.forEach((s) => {
                        if (typeof s == "object" && "nominal" in s) {
                          addArtistNominal(s, category, song, subCat);
                        } else {
                          addArtist(s, category, song, subCat);
                        }
                      });
                    } else if (typeof subArtist == "object" && "nominal" in subArtist) {
                      addArtistNominal(subArtist, category, song, subCat);
                    }
                  }
                }
              } else {
                throw "error!";
              }
            }
          });
        }

        artists = Object.fromEntries(
          Object.entries(artists).sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()))
        );
        for (let artist in artists) {
          for (let category in artists[artist]) {
            if (category == "dlc") continue;

            if (Array.isArray(artists[artist][category])) {
              artists[artist][category].sort((a, b) => {
                if (a["dlc"] == b["dlc"]) {
                  return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
                }
                return Object.keys(list["songs"]).indexOf(a["dlc"]) - Object.keys(list["songs"]).indexOf(b["dlc"]);
              });
            } else {
              for (let subCat in artists[artist][category]) {
                artists[artist][category][subCat].sort((a, b) => {
                  if (a["dlc"] == b["dlc"]) {
                    return a["title"].toLowerCase().localeCompare(b["title"].toLowerCase());
                  }
                  return Object.keys(list["songs"]).indexOf(a["dlc"]) - Object.keys(list["songs"]).indexOf(b["dlc"]);
                });
              }
            }
          }
        }

        setDlcSelect(new Set(Object.keys(list["songs"])));
        setLoading(false);
      });
  }, []);

  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState("compose");
  const [dlcSelect, setDlcSelect] = React.useState(new Set());

  const onChange = (event) => {
    setMode(event.target.value);
  };
  const onCheck = () => {
    setDlcSelect(new Set(Object.keys(list["songs"])));
  };
  const onUncheck = () => {
    setDlcSelect(new Set());
  };
  const onDlcSelect = (event) => {
    if (event.target.checked) {
      dlcSelect.add(event.target.value);
    } else {
      dlcSelect.delete(event.target.value);
    }
    setDlcSelect(new Set(dlcSelect));
  };

  return (
    <>
      <div className="center">
        <button type="button" onClick={onCheck}>
          모두 선택
        </button>
        <button type="button" onClick={onUncheck}>
          모두 해제
        </button>
      </div>
      {loading ? (
        <h1 className="center">로딩...</h1>
      ) : (
        <>
          <DlcSelect dlcSelect={dlcSelect} onDlcSelect={onDlcSelect} />
          <div id="result">
            <Select onChange={onChange} />
            {mode != "title" && <Buttons />}
            {mode == "title" ? <Title dlcSelect={dlcSelect} /> : <Artist mode={mode} dlcSelect={dlcSelect} />}
          </div>
        </>
      )}
    </>
  );
}

function DlcSelect({ dlcSelect, onDlcSelect }) {
  React.useEffect(() => {
    document.querySelectorAll("#dlcSelect input").forEach((input) => {
      input.checked = dlcSelect.has(input.value);
    });
  }, [dlcSelect]);

  return (
    <div id="dlcSelect" onChange={onDlcSelect}>
      {Object.keys(list["songs"]).map((category) => (
        <label key={category} className="shadow-white bold">
          <input type="checkbox" value={category} defaultChecked={dlcSelect.has(category)} />
          {list["dlcKor"][category]}
        </label>
      ))}
    </div>
  );
}

function Select({ onChange }) {
  let labels = Object.entries(categoryKorMap)
    .slice(0, -4)
    .map(([eng, kor], i) => (
      <label key={eng}>
        <input type="radio" name="mode" value={eng} defaultChecked={i == 1} />
        {kor}
      </label>
    ));

  return (
    <div id="selectMode" onChange={onChange}>
      {labels}
    </div>
  );
}

function Buttons() {
  const spread = () => {
    document.querySelectorAll("details").forEach((details) => {
      details.open = true;
    });
  };
  const collapse = () => {
    document.querySelectorAll("details").forEach((details) => {
      details.open = false;
    });
  };

  return (
    <div id="buttons" className="center">
      <button type="button" id="spread" onClick={spread}>
        모두 펼치기
      </button>
      <button type="button" id="collapse" onClick={collapse}>
        모두 접기
      </button>
    </div>
  );
}

function Artist({ mode, dlcSelect }) {
  let artistList = Object.keys(artists).filter((artist) =>
    [...artists[artist]["dlc"]].some((dlc) => dlcSelect.has(dlc))
  );

  if (mode != "all") {
    artistList = artistList.filter((artist) => mode in artists[artist]);

    if (["feat", "visualize"].includes(mode)) {
      artistList = artistList.filter((artist) =>
        Object.values(artists[artist][mode])
          .reduce((a, b) => [...a, ...b])
          .some((song) => dlcSelect.has(song["dlc"]))
      );
    } else {
      artistList = artistList.filter((artist) => artists[artist][mode].some((song) => dlcSelect.has(song["dlc"])));
    }
  }

  return (
    <ul id="artistUl">
      {artistList.map((artist) => (
        <li key={artist} className="artistLi left">
          <details>
            <summary>{artist}</summary>
            <Category mode={mode} artist={artist} dlcSelect={dlcSelect} />
          </details>
        </li>
      ))}
    </ul>
  );
}

function Category({ mode, artist, dlcSelect }) {
  let categoryLi = [];

  for (let category in artists[artist]) {
    if ((mode != "all" && category != mode) || category == "dlc") {
      continue;
    }

    let subCatOrSong = null,
      songList = [];

    if (["feat", "visualize"].includes(category)) {
      let subCats = [];

      for (let subCat in artists[artist][category]) {
        songList = artists[artist][category][subCat].filter((song) => dlcSelect.has(song["dlc"]));

        if (songList.length) {
          if (["feat", "visualize"].includes(subCat)) {
            subCats.unshift(
              // <SongUl key={subCat} songList={songList} artist={artist} style={{"listStyleType": (mode == "all")? "none" : ""}}/>
              <SongUl key={subCat} songList={songList} artist={artist} />
            );
          } else {
            subCats.push(
              <ul key={subCat} className="subCatUl">
                <li className="subCatLi">
                  <p>{category == "visualize" ? categoryKorMap[subCat] : subCat}</p>
                  <SongUl songList={songList} artist={artist} />
                </li>
              </ul>
            );
          }
        }
      }

      subCatOrSong = subCats;
    } else {
      songList = artists[artist][category].filter((song) => dlcSelect.has(song["dlc"]));

      if (songList.length) {
        subCatOrSong = <SongUl key={category} songList={songList} artist={artist} />;
      }
    }

    if (Array.isArray(subCatOrSong) ? subCatOrSong.length : subCatOrSong) {
      categoryLi.push(
        <li key={category} className="categoryLi" style={{ listStyleType: mode == "all" ? "" : "none" }}>
          <p hidden={mode != "all"}>{categoryKorMap[category]}</p>
          {subCatOrSong}
        </li>
      );
    }
  }

  return <ul className="categoryUl">{categoryLi}</ul>;
}

function SongUl({ songList, artist, style }) {
  return (
    // <ul className="songUl" style={style || {"listStyleType": "none"}}>
    <ul className="songUl">
      {songList.map((song) => (
        <SongLi key={song["uniqueTitle"]} song={song} artist={artist} />
      ))}
    </ul>
  );
}

function SongLi({ song, artist, credit }) {
  if (typeof artist == "object") {
    if (Array.isArray(artist)) {
      artist = artist[0];
    } else if ("nominal" in artist) {
      artist = artist["nominal"];
    }
  }

  return (
    <li className="songLi" style={credit ? null : getCategoryStyle(song["dlc"], list["collaboration"])}>
      <img src={`${song["urlTitle"]}_1.png`} />
      {credit ? (
        <Credit song={credit} />
      ) : (
        <div>
          <p>{song["title"]}</p>
        </div>
      )}
    </li>
  );
}

function Title({ dlcSelect }) {
  return (
    <ul id="titleUl">
      {songs
        .filter((song) => dlcSelect.has(song["dlc"]))
        .map((song) => (
          <SongLi key={song["uniqueTitle"]} song={song} artist={song["artist"]["compose"]} credit={song} />
        ))}
    </ul>
  );
}

function Credit({ song }) {
  let credits = [];

  for (let category in song["artist"]) {
    let art = "";
    let artist = song["artist"][category];

    if (typeof artist == "string" || Array.isArray(artist)) {
      if (typeof artist == "string") {
        artist = [artist];
      }
      artist = artist.map((a) => (typeof a == "object" && "nominal" in a ? a["nominal"] : a));
      art += artist.join(" / ");
    } else if (typeof artist == "object") {
      if ("nominal" in artist) {
        art += artist["nominal"];
      } else {
        let subArtist = [];
        for (let subCat in artist) {
          if (typeof artist[subCat] == "string" || Array.isArray(artist[subCat])) {
            if (typeof artist[subCat] == "string") {
              artist[subCat] = [artist[subCat]];
            }
            artist[subCat].forEach((s) => {
              subArtist.push(typeof s == "object" && "nominal" in s ? s["nominal"] : s);
            });
          } else if (typeof artist[subCat] == "object" && "nominal" in artist[subCat]) {
            subArtist.push(artist[subCat]["nominal"]);
          }
        }
        art += subArtist.join(" / ");
      }
    }
    credits.push(
      <p key={category}>
        <span className="cat">{category[0].toUpperCase() + category.slice(1)}</span>
        <span className="art">{art}</span>
      </p>
    );
  }

  return (
    <div>
      <h3>{song["title"]}</h3>
      {credits}
    </div>
  );
}

function addArtist(artist, category, song, subCat) {
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
  if (!("dlc" in artists[artist])) {
    artists[artist]["dlc"] = new Set();
  }

  if (["feat", "visualize"].includes(category)) {
    artists[artist][category][subCat].push(song);
  } else {
    artists[artist][category].push(song);
  }

  artists[artist]["dlc"].add(song["dlc"]);
}

function addArtistNominal(artist, category, song, subCat) {
  let extra;

  if ("alias" in artist) {
    extra = `(=${artist["alias"]})`;
  } else if ("ambiguous" in artist) {
    extra = `(${artist["ambiguous"]})`;
  } else if ("include" in artist) {
    let include = artist["include"];
    if (typeof include == "string") {
      include = [include];
    }
    extra = `(⊃${include.join(" / ")})`;
  }

  if (["feat", "visualize"].includes(category)) {
    addArtist(`${artist["nominal"]} ${extra}`, category, song, subCat || category);
  } else {
    addArtist(`${artist["nominal"]} ${extra}`, category, song, null);
  }

  if ("alias" in artist) {
    if (["feat", "visualize"].includes(category)) {
      addArtist(artist["alias"], category, song, subCat || category);
    } else {
      addArtist(artist["alias"], category, song, null);
    }
  }
  if ("include" in artist) {
    let include = artist["include"];
    if (typeof include == "string") {
      include = [include];
    }
    include.forEach((i) => {
      if (["feat", "visualize"].includes(category)) {
        addArtist(i, category, song, subCat || category);
      } else {
        addArtist(i, category, song, null);
      }
    });
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

function listSongs(artist) {
  let songs = new Set();

  for (let category in artist) {
    if (category == "dic") continue;

    if (Array.isArray(artist[category])) {
      artist[category].forEach((song) => {
        songs.add(song);
      });
    } else {
      for (let subCat in artist[category]) {
        artist[category][subCat].forEach((song) => {
          songs.add(song);
        });
      }
    }
  }

  return [...songs];
}

ReactDOM.render(<App />, document.querySelector("#root"));
