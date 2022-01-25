let categoryKorMap = {
    "all": "전체",
    "compose": "작곡",
    "remix": "리믹스",
    "visualize": "BGA",
    "vocal": "보컬",
    "feat": "피처링",
    "lyrics": "작사",
    "arrange": "편곡",
    "title": "제목",
    "illust": "원화",
    "motion": "모션",
    "background": "배경",
    "story": "스토리"
};
let list = {};
let songs = [];
let artists = {};
let featRegex = /([^()]+)(?:\((.+)\))?/;

function App() {
    React.useEffect(() => {
        fetch("../list.json")
        .then(response => response.json())
        .then(json => {
            list = json;
            for (let dlc in list["songs"]) {
                list["songs"][dlc] = list["songs"][dlc].map(song => new Song(song));
            }

            songs = Object.values(json["songs"]).reduce((a,b) => [...a, ...b]).sort((a,b) => a["title"].toLowerCase().localeCompare(b["title"].toLowerCase()));

            for (let dlc in list["songs"]) {
                list["songs"][dlc].forEach(song => {
                    song["dlc"] = dlc;

                    for (let category in song["artist"]) {
                        let artist = song["artist"][category];
                        if (typeof artist == "string" || Array.isArray(artist)) {
                            if (typeof artist == "string") {
                                artist = [artist];
                            }
                            artist.forEach(a => {
                                if (category == "feat") {
                                    let result = featRegex.exec(a);
                                    if (result[2]) {
                                        addArtist(result[1], category, song, result[2], dlc);
                                    }
                                    else {
                                        addArtist(result[1], category, song, category, dlc);
                                    }
                                }
                                else if (category == "visualize") {
                                    addArtist(a, category, song, category, dlc);
                                }
                                else {
                                    addArtist(a, category, song, null, dlc);
                                }
                            });
                        }
                        else if (typeof artist == "object") {
                            if ("nominal" in artist) {
                                let extra = artist["alias"] || artist["ambiguous"];
                                if (["feat","visualize"].includes(category)) {
                                    addArtist(`${artist["nominal"]} (${extra})`, category, song, category, dlc);
                                }
                                else {
                                    addArtist(`${artist["nominal"]} (${extra})`, category, song, null, dlc);
                                }
                                if ("alias" in artist) {
                                    if (["feat","visualize"].includes(category)) {
                                        addArtist(extra, category, song, category, dlc);
                                    }
                                    else {
                                        addArtist(extra, category, song, null, dlc);
                                    }
                                }
                            }
                            else {  //visualize
                                for (let subCat in artist) {
                                    let subArtist = artist[subCat];
                                    if (typeof subArtist == "string") {
                                        subArtist = [subArtist];
                                    }
                                    subArtist.forEach(s => {
                                        addArtist(s, category, song, subCat, dlc);
                                    });
                                }
                            }
                        }
                        else {
                            throw "error!";
                        }
                    }
                });
            }
            artists = Object.fromEntries(Object.entries(artists).sort((a,b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase())));
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
        }
        else {
            dlcSelect.delete(event.target.value);
        }
        setDlcSelect(new Set(dlcSelect));
    };

    return (
        loading ? (
            <h1 className="center">로딩...</h1>
        ) : (
            <div>
                <div className="center">
                    <button type="button" onClick={onCheck}>모두 선택</button>
                    <button type="button" onClick={onUncheck}>모두 해제</button>
                </div>
                <DlcSelect dlcSelect={dlcSelect} onDlcSelect={onDlcSelect}/>
                <div id="result">
                    <Select onChange={onChange}/>
                    {mode != "title" && <Buttons/>}
                    {(mode == "title")? <Title dlcSelect={dlcSelect}/> : <Artist mode={mode} dlcSelect={dlcSelect}/>}
                </div>
            </div>
        )
    );
}

function DlcSelect({ dlcSelect, onDlcSelect }) {
    React.useEffect(() => {
        document.querySelectorAll("#dlcSelect input").forEach(input => {
            input.checked = dlcSelect.has(input.value);
        });
    }, [dlcSelect]);

    return (
        <div id="dlcSelect" onChange={onDlcSelect}>
            {Object.keys(list["songs"]).map(category =>
                <label key={category} className="shadow-white">
                    <input type="checkbox" value={category} defaultChecked={dlcSelect.has(category)}/>
                    {list["dlcKor"][category]}
                </label>
            )}
        </div>
    );
}

function Select({ onChange }) {
    let labels = Object.entries(categoryKorMap).slice(0, -4).map(([eng, kor], i) =>
        <label key={eng}>
            <input type="radio" name="mode" value={eng} defaultChecked={i == 1}/>{kor}
        </label>
    );

    return (
        <div id="selectMode" onChange={onChange}>
            {labels}
        </div>
    );
}

function Buttons() {
    const spread = () => {
        document.querySelectorAll("details").forEach(details => {
            details.open = true;
        });
    };
    const collapse = () => {
        document.querySelectorAll("details").forEach(details => {
            details.open = false;
        });
    };
    return (
        <div id="buttons" className="center">
            <button type="button" id="spread" onClick={spread}>모두 펼치기</button>
            <button type="button" id="collapse" onClick={collapse}>모두 접기</button>
        </div>
    );
}

function Artist({ mode, dlcSelect }) {
    let artistList = Object.keys(artists).filter(artist => [...artists[artist]["dlc"]].some(dlc => dlcSelect.has(dlc)));

    if (mode != "all") {
        artistList = artistList.filter(artist => mode in artists[artist]);

        if (["feat","visualize"].includes(mode)) {
            artistList = artistList.filter(artist => Object.values(artists[artist][mode]).reduce((a,b) => [...a, ...b]).some(song => dlcSelect.has(song["dlc"])));
        }
        else {
            artistList = artistList.filter(artist => artists[artist][mode].some(song => dlcSelect.has(song["dlc"])));
        }
    }

    return (
        <ul id="artistUl">
            {artistList.map(artist =>
                <li key={artist} className="artistLi left">
                    <details>
                        <summary>{artist}</summary>
                        <Category mode={mode} artist={artist} dlcSelect={dlcSelect}/>
                    </details>
                </li>
            )}
        </ul>
    );
}

function Category({ mode, artist, dlcSelect }) {
    let categoryLi = [];

    for (let category in artists[artist]) {
        if ((mode != "all" && category != mode) || category == "dlc") {
            continue;
        }

        let subCatOrSong = null, songList = [];

        if (["feat","visualize"].includes(category)) {
            let subCats = [];

            for (let subCat in artists[artist][category]) {
                songList = artists[artist][category][subCat].filter(song => dlcSelect.has(song["dlc"]));

                if (songList.length) {
                    if (["feat","visualize"].includes(subCat)) {
                        subCats.unshift(
                            // <SongUl key={subCat} songList={songList} artist={artist} style={{"listStyleType": (mode == "all")? "none" : ""}}/>
                            <SongUl key={subCat} songList={songList} artist={artist}/>
                        );
                    }
                    else {
                        subCats.push(
                            <ul key={subCat} className="subCatUl">
                                <li className="subCatLi">
                                    <p>{(category == "visualize")? categoryKorMap[subCat] : subCat}</p>
                                    <SongUl songList={songList} artist={artist}/>
                                </li>
                            </ul>
                        );
                    }
                }
            }

            subCatOrSong = subCats;
        }
        else {
            songList = artists[artist][category].filter(song => dlcSelect.has(song["dlc"]));

            if (songList.length) {
                subCatOrSong = <SongUl key={category} songList={songList} artist={artist}/>;
            }
        }

        if (subCatOrSong && (Array.isArray(subCatOrSong)? subCatOrSong.length : true)) {
            categoryLi.push(
                <li key={category} className="categoryLi" style={{"listStyleType": (mode == "all")? "" : "none"}}>
                    <p hidden={mode != "all"}>{categoryKorMap[category]}</p>
                    {subCatOrSong}
                </li>
            );
        }
    }

    return (
        <ul className="categoryUl">
            {categoryLi}
        </ul>
    );
}

function SongUl({ songList, artist, style }) {
    return (
        // <ul className="songUl" style={style || {"listStyleType": "none"}}>
        <ul className="songUl">
            {songList.map(song =>
                <SongLi key={song["uniqueTitle"]} title={song["title"]} artist={artist}/>
            )}
        </ul>
    );
}

function SongLi({ title, artist, credit }) {
    if (typeof artist == "object") {
        if (Array.isArray(artist)) {
            artist = artist[0];
        }
        else if ("nominal" in artist) {
            artist = artist["nominal"];
        }
    }

    let urlTitle = songs.find(s => s["title"] == title && listArtists(s).some(a => a.includes(artist)))["urlTitle"];

    return (
        <li className="songLi">
            <img src={`${urlTitle}_1.png`}/>
            {credit ? <Credit song={credit}/> : <div><p>{title}</p></div>}
        </li>
    );
}

function Title({ dlcSelect }) {
    return (
        <ul id="titleUl">
            {songs.filter(song => dlcSelect.has(song["dlc"])).map(song =>
                <SongLi key={song["uniqueTitle"]} title={song["title"]} artist={song["artist"]["compose"]} credit={song}/>
            )}
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
            art += artist.join(" / ");
        }
        else if (typeof artist == "object") {
            if ("nominal" in artist) {
                art += artist["nominal"];
            }
            else {
                let subArtist = [];
                for (let subCat in artist) {
                    if (typeof artist[subCat] == "string") {
                        artist[subCat] = [artist[subCat]];
                    }
                    artist[subCat].forEach(s => {
                        subArtist.push(s);
                    })
                }
                art += subArtist.join(" / ");
            }
        }
        credits.push(
            <p key={category}>
                <span className="cat">{category[0].toUpperCase()}{category.slice(1)}</span>
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

function addArtist(artist, category, song, subCat, dlc) {
    if (!(artist in artists)) {
        artists[artist] = {}
    }
    if (!(category in artists[artist])) {
        if (["feat","visualize"].includes(category)) {
            artists[artist][category] = {};
        }
        else {
            artists[artist][category] = [];
        }
    }
    if (["feat","visualize"].includes(category)) {
        if (!(subCat in artists[artist][category])) {
            artists[artist][category][subCat] = [];
        }
    }
    if (!("dlc" in artists[artist])) {
        artists[artist]["dlc"] = new Set();
    }

    if (["feat","visualize"].includes(category)) {
        artists[artist][category][subCat].push(song);
        artists[artist][category][subCat].sort((a,b) => a["title"].toLowerCase().localeCompare(b["title"].toLowerCase()));
    }
    else {
        artists[artist][category].push(song);
        artists[artist][category].sort((a,b) => a["title"].toLowerCase().localeCompare(b["title"].toLowerCase()));
    }

    artists[artist]["dlc"].add(dlc);
}

function listArtists(song) {
    let artists = new Set();

    for (let category in song["artist"]) {
        let artist = song["artist"][category];
        if (typeof artist == "string" || Array.isArray(artist)) {
            if (typeof artist == "string") {
                artist = [artist];
            }
            artist.forEach(a => {
                artists.add(a);
            });
        }
        else if (typeof artist == "object"){
            if ("nominal" in artist) {
                let extra = artist["alias"] || artist["ambiguous"];
                artists.add(`${artist["nominal"]} (${extra})`);
            }
            else {
                for (let subCat in artist) {
                    let subArtist = artist[subCat];
                    if (typeof subArtist == "string") {
                        subArtist = [subArtist];
                    }
                    subArtist.forEach(a => {
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
            artist[category].forEach(song => {
                songs.add(song);
            });
        }
        else {
            for (let subCat in artist[category]) {
                artist[category][subCat].forEach(song => {
                    songs.add(song);
                });
            }
        }
    }

    return [...songs];
}

ReactDOM.render(<App/>, document.querySelector("#root"));