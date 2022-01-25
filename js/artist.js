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
    const [loading, setLoading] = React.useState(true);
    const [mode, setMode] = React.useState("compose");
    React.useEffect(() => {
        fetch("../list.json")
        .then(response => response.json())
        .then(json => {
            list = json;
            for (let category in list["songs"]) {
                list["songs"][category] = list["songs"][category].map(song => new Song(song));
            }
            songs = Object.values(json["songs"]).reduce((a,b) => [...a, ...b]).sort((a,b) => a["title"].toLowerCase().localeCompare(b["title"].toLowerCase()));
            songs.forEach(song => {
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
                                    addArtist(result[1], category, song["title"], result[2]);
                                }
                                else {
                                    addArtist(result[1], category, song["title"], category);
                                }
                            }
                            else if (category == "visualize") {
                                addArtist(a, category, song["title"], category);
                            }
                            else {
                                addArtist(a, category, song["title"]);
                            }
                        });
                    }
                    else if (typeof artist == "object") {
                        if ("nominal" in artist) {
                            let extra = artist["alias"] || artist["ambiguous"];
                            if (["feat","visualize"].includes(category)) {
                                addArtist(`${artist["nominal"]} (${extra})`, category, song["title"], category);
                            }
                            else {
                                addArtist(`${artist["nominal"]} (${extra})`, category, song["title"]);
                            }
                            if ("alias" in artist) {
                                if (["feat","visualize"].includes(category)) {
                                    addArtist(extra, category, song["title"], category);
                                }
                                else {
                                    addArtist(extra, category, song["title"]);
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
                                    addArtist(s, category, song["title"], subCat);
                                });
                            }
                        }
                    }
                    else {
                        throw "error!";
                    }
                }
            });
            artists = Object.fromEntries(Object.entries(artists).sort((a,b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase())));
            setLoading(false);
        });
    }, []);

    const onChange = (event) => {
        setMode(event.target.value);
    };

    return (
        loading ? (
            <h1 className="center">로딩...</h1>
        ) : (
            <div id="result">
                <Select onChange={onChange}/>
                {mode != "title" && <Buttons/>}
                {(mode == "title")? <Title/> : <Artist mode={mode}/>}
            </div>
        )
    );
}

function Select({ onChange }) {
    let labels = Object.entries(categoryKorMap).slice(0,-3).map(([eng, kor], i) =>
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

function Artist({ mode }) {
    let artistList = (mode == "all")? Object.keys(artists) : Object.keys(artists).filter(artist => mode in artists[artist]);

    return (
        <ul id="artistUl">
            {artistList.map(artist =>
                <li key={artist} className="artistLi left">
                    <details>
                        <summary>{artist}</summary>
                        <Category mode={mode} artist={artist}/>
                    </details>
                </li>
            )}
        </ul>
    );
}

function Category({ mode, artist }) {
    let categoryLi = [];

    for (let category in artists[artist]) {
        if (mode != "all" && category != mode) {
            continue;
        }

        let subCatOrSong;

        if (["feat","visualize"].includes(category)) {
            let subCats = [];
            for (let subCat in artists[artist][category]) {
                if (["feat","visualize"].includes(subCat)) {
                    subCats.unshift(
                        <SongUl key={subCat} songList={artists[artist][category][subCat]} artist={artist}/>
                    );
                }
                else {
                    subCats.push(
                        <ul key={subCat} className="subCatUl">
                            <li className="subCatLi">
                                <p>{(category == "visualize")? categoryKorMap[subCat] : subCat}</p>
                                <SongUl songList={artists[artist][category][subCat]} artist={artist}/>
                            </li>
                        </ul>
                    );
                }
            }
            subCatOrSong = subCats;
        }
        else {
            subCatOrSong = <SongUl key={category} songList={artists[artist][category]} artist={artist}/>;
        }

        categoryLi.push(
            <li key={category} className="categoryLi" style={{"list-style-type": (mode == "all")? "" : "none"}}>
                {(mode == "all") && <p>{categoryKorMap[category]}</p>}
                {subCatOrSong}
            </li>
        );
    }

    return (
        <ul className="categoryUl">
            {categoryLi}
        </ul>
    );
}

function SongUl({ songList, artist }) {
    return (
        <ul className="songUl">
            {songList.map(song =>
                <SongLi key={song} title={song} artist={artist}/>
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

function Title() {
    return (
        <ul id="titleUl">
            {songs.map((song, i) =>
                <SongLi key={song["title"]+song["artist"]["compose"]} title={song["title"]} artist={song["artist"]["compose"]} credit={song}/>
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

function addArtist(artist, category, title, subCat) {
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

    if (["feat","visualize"].includes(category)) {
        artists[artist][category][subCat].push(title);
        artists[artist][category][subCat].sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }
    else {
        artists[artist][category].push(title);
        artists[artist][category].sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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

ReactDOM.render(<App/>, document.querySelector("#root"));