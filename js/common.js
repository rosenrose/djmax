function toggleAttribute(attribute, value, ...element) {
    if (typeof attribute == "string") {
        attribute = attribute.split(".");
    }
    element.forEach(elem => {
        let obj = elem;
        attribute.forEach((attr, i) => {
            if (i < attribute.length-1) {
                obj = obj[attr];
            }
            else {
                obj[attr] = value;
            }
        });
    });
}

function selectAttribute(query, attribute, trueValue, falseValue, ...element) {
    if (typeof attribute == "string") {
        attribute = attribute.split(".");
    }
    element.forEach(elem => {
        let obj = elem;
        attribute.forEach((attr, i) => {
            if (i < attribute.length-1) {
                obj = obj[attr];
            }
            else {
                obj[attr] = elem.matches(query)? trueValue : falseValue;
            }
        });
    });
}

function appendTemp(element, ...target) {
    fragMap = window.fragMap ?? new Map();

    if (!fragMap.has(element)) {
        fragMap.set(element, document.createDocumentFragment());
    }

    fragMap.get(element).append(...target);
}

function appendRestore() {
    for (let [element, fragment] of fragMap) {
        element.after(fragment);
    }

    fragMap.clear();
}

function randomInt(minInclude, maxExclude) {
    return Math.floor(Math.random() * (maxExclude - minInclude)) + minInclude;
}

function range(startInclude, endExclude) {
    return [...Array(endExclude - startInclude).keys()].map(num => num + startInclude);
}

function toggleInput(input, condition) {
    input.disabled = !condition;
    input.parentNode.style.color = condition? "" : "gray";
}

function getCategoryStyle(category, collab) {
    return {
        color: (category == "clazziquai")? "" : "#fff",
        backgroundImage: `url(/djmax/img/color_${(collab.includes(category))? "collaboration" : category}.png)`
        // backgroundSize: "100% 100%"
    };
}

function Song(song, isStat) {
    for (let key in song) {
        this[key] = song[key];
    }

    let title = this["title"];
    if (["Alone", "Urban Night", "Voyage"].includes(title)) {
        title += ` (${this["artist"]["compose"]})`;
    };
    this["uniqueTitle"] = title;

    [["\\", "＼"], ["/", "／"], [":", "："], ["*", "＊"], ["?", "？"], ["\"", "＂"], ["<", "＜"], [">", "＞"], ["|", "｜"]].forEach(char => {
        title = title.replace(char[0], char[1]);
    });
    title = new URLSearchParams({title}).toString().split("=")[1];
    this["urlTitle"] =  `https://d2l1b145ht03q6.cloudfront.net/djmax/song_pic/${title}`;

    if (isStat) {
        let commonHeads = ["전체", ...Object.keys(this["level"])];

        for (let platform in this["date"]) {
            this["date"][platform] = new Date(this["date"][platform]);
        }

        if ("PS4" in this["date"] && "PC" in this["date"]) {
            if (this["date"]["PS4"] <= this["date"]["PC"]) {
                this["date"]["early"] = this["date"]["PS4"];
                this["date"]["earlyPlatform"] = (this["date"]["PS4"] < this["date"]["PC"])? "PS4" : "PS4, PC";
            }
            else {
                this["date"]["early"] = this["date"]["PC"];
                this["date"]["earlyPlatform"] = "PC";
            }
        }
        else {
            let isPS4 = "PS4" in this["date"];
            this["date"]["early"] = isPS4? this["date"]["PS4"] : this["date"]["PC"];
            this["date"]["earlyPlatform"] = isPS4? "PS4" : "PC";
            this["date"][isPS4? "PC" : "PS4"] = 0;  //정렬 비교할 때 필요
        }
        if (!("early" in this["date"])) throw "err!";

        [this["levelSum"], this["patternCount"], this["levelAvg"], this["minLevel"], this["maxLevel"], this["levelCount"], this["noteSum"], this["noteAvg"], this["noteCount"]] = [{},{},{},{},{},{},{},{},{}];

        commonHeads.forEach(head => {
            this["levelSum"][head] = this["patternCount"][head] = this["levelAvg"][head] = this["noteSum"][head] = this["noteAvg"][head] = 0;
        });
        this["patternCount"]["SC"] = 0;

        for (let btn in this["level"]) {
            let levels = Object.values(this["level"][btn]);

            this["minLevel"][btn] = Math.min(...levels);
            this["maxLevel"][btn] = Math.max(...levels);

            for (let rank in this["level"][btn]) {
                let level = this["level"][btn][rank];

                this["levelSum"][btn] += level;
                this["levelSum"]["전체"] += level;
                this["patternCount"][btn] += 1;
                this["patternCount"]["전체"] += 1;

                if (rank == "SC") {
                    this["patternCount"]["SC"] += 1;
                }

                if (!(level in this["levelCount"])) {
                    this["levelCount"][level] = {"전체": 0};
                }
                if(!(btn in this["levelCount"][level])) {
                    this["levelCount"][level][btn] = 0;
                }
                this["levelCount"][level][btn] += 1;
                this["levelCount"][level]["전체"] += 1;
            }

            for (let rank in this["note"][btn]) {
                let note = this["note"][btn][rank];

                this["noteSum"][btn] += note;
                this["noteSum"]["전체"] += note;

                let noteCountKey = noteRange(note).key
                if (!(noteCountKey in this["noteCount"])) {
                    this["noteCount"][noteCountKey] = {"전체": 0};
                }
                if(!(btn in this["noteCount"][noteCountKey])) {
                    this["noteCount"][noteCountKey][btn] = 0;
                }
                this["noteCount"][noteCountKey][btn] += 1;
                this["noteCount"][noteCountKey]["전체"] += 1;
            }
        }

        this["minLevel"]["전체"] = Math.min(...Object.values(this["minLevel"]));
        this["maxLevel"]["전체"] = Math.max(...Object.values(this["maxLevel"]));

        commonHeads.forEach(head => {
            this["levelAvg"][head] = this["levelSum"][head] / this["patternCount"][head];
            this["noteAvg"][head] = this["noteSum"][head] / this["patternCount"][head];
        });
    }
}

function noteRange(note) {
    if (note == 0) {
        return {lower: 0, upper: 0, key: "0"}
    }

    let lower = (parseInt((note - 1) / 100) * 100) + 1;
    let upper = (parseInt((note - 1) / 100) + 1) * 100;

    return {
        lower,
        upper,
        "key": `${lower} ~ ${upper}`
    };
}