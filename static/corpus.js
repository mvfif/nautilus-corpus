let corpusData = [];

/* =========================
   NORMALIZATION
========================= */

function normalize(text) {
    return (text || "")
        .toLowerCase()
        .replace(/ё/g, "е")
        .trim();
}

/* =========================
   FILTERS
========================= */

const FILTERS = [
    "pos",
    "case",
    "number",
    "gender",
    "tense",
    "aspect",
    "person",
    "mood",
    "voice",
    "animacy",
    "album",
    "author"
];

/* =========================
   GRAMMAR LABELS
========================= */

const grammarMap = {

    /* POS */

    "NOUN": "существительное",
    "VERB": "глагол",
    "INFN": "инфинитив",
    "ADJF": "прилагательное",
    "ADJS": "краткое прилагательное",
    "COMP": "компаратив",
    "PRTF": "причастие",
    "PRTS": "краткое причастие",
    "GRND": "деепричастие",
    "NUMR": "числительное",
    "ADVB": "наречие",
    "NPRO": "местоимение",
    "PRED": "предикатив",
    "PREP": "предлог",
    "CONJ": "союз",
    "PRCL": "частица",
    "INTJ": "междометие",

    /* CASE */

    "nomn": "именительный",
    "gent": "родительный",
    "datv": "дательный",
    "accs": "винительный",
    "ablt": "творительный",
    "loct": "предложный",
    "voct": "звательный",
    "gen2": "второй родительный",
    "loc2": "второй предложный",

    /* NUMBER */

    "sing": "ед. число",
    "plur": "мн. число",

    /* GENDER */

    "masc": "мужской",
    "femn": "женский",
    "neut": "средний",

    /* TENSE */

    "past": "прошедшее",
    "pres": "настоящее",
    "futr": "будущее",

    /* ASPECT */

    "perf": "совершенный вид",
    "impf": "несовершенный вид",

    /* PERSON */

    "1per": "1 лицо",
    "2per": "2 лицо",
    "3per": "3 лицо",

    /* MOOD */

    "indc": "изъявительное",
    "impr": "повелительное",

    /* VOICE */

    "actv": "действительный",
    "pssv": "страдательный",

    /* ANIMACY */

    "anim": "одушевленное",
    "inan": "неодушевленное"
};

/* =========================
   LOAD DATA
========================= */

fetch('/data')
    .then(response => response.json())
    .then(data => {

        corpusData = data;

        buildFilters();

    });

/* =========================
   BUILD FILTERS
========================= */

function buildFilters() {

    FILTERS.forEach(field => {

        const container = document.getElementById(field);

        if (!container) return;

        let values = [...new Set(
            corpusData
                .map(item => item[field])
                .filter(value =>
                    value &&
                    value !== ""
                )
        )];

        values.sort();

        values.forEach(value => {

            const label = document.createElement("label");

            label.innerHTML = `
                <input
                    type="checkbox"
                    name="${field}"
                    value="${value}"
                >
                ${grammarMap[value] || value}
            `;

            container.appendChild(label);
        });
    });
}

/* =========================
   GET SELECTED FILTERS
========================= */

function getSelected(field) {

    return [
        ...document.querySelectorAll(
            `input[name="${field}"]:checked`
        )
    ].map(input => input.value);
}

/* =========================
   SEARCH
========================= */

function searchCorpus() {

    const query = normalize(
        document.getElementById("searchInput").value
    );

    const mode = document.querySelector(
        'input[name="searchMode"]:checked'
    ).value;

    let results = corpusData.filter(item => {

        /* SEARCH */

        if (query !== "") {

            const target = normalize(
                mode === "lemma"
                    ? item.lemma
                    : item.word
            );

            if (!target.includes(query)) {
                return false;
            }
        }

        /* FILTERS */

        for (let field of FILTERS) {

            const selected = getSelected(field);

            if (selected.length > 0) {

                if (!selected.includes(item[field])) {
                    return false;
                }
            }
        }

        return true;
    });

    /* LIMIT RESULTS */

    results = results.slice(0, 200);

    renderResults(results);
}

/* =========================
   SHORT KWIC
========================= */

function buildKWIC(text, word) {

    if (!text || !word) return "";

    text = text.replace(/<br>/g, " ");

    const normalizedText = normalize(text);
    const normalizedWord = normalize(word);

    const index = normalizedText.indexOf(normalizedWord);

    if (index === -1) return text;

    const start = Math.max(0, index - 30);

    const end = Math.min(
        text.length,
        index + word.length + 30
    );

    let snippet = text.slice(start, end);

    const regex = new RegExp(`(${word})`, "gi");

    snippet = snippet.replace(
        regex,
        '<span class="highlight">$1</span>'
    );

    return `... ${snippet} ...`;
}

/* =========================
   FULL CONTEXT
========================= */

function formatFullContext(text, word) {

    if (!text) return "";

    const regex = new RegExp(`(${word})`, "gi");

    return text.replace(
        regex,
        '<span class="highlight">$1</span>'
    );
}

/* =========================
   RENDER RESULTS
========================= */

function renderResults(results) {

    const container = document.getElementById("results");

    const count = document.getElementById("resultsCount");

    count.innerText =
        `Найдено: ${results.length}`;

    container.innerHTML = "";

    if (results.length === 0) {

        container.innerHTML = `
            <div class="result-card">
                Ничего не найдено
            </div>
        `;

        return;
    }

    results.forEach(item => {

        const card = document.createElement("div");

        card.className = "result-card";

        /* TAGS */

        const tags = [

            item.pos,
            item.case,
            item.number,
            item.gender,
            item.tense,
            item.aspect,
            item.person,
            item.mood,
            item.voice,
            item.animacy

        ]
        .filter(Boolean)
        .map(tag => `
            <span class="tag">
                ${grammarMap[tag] || tag}
            </span>
        `)
        .join("");

        /* CARD */

        card.innerHTML = `

            <div class="word">
                ${item.word || ""}
            </div>

            <div class="lemma">
                Лемма: ${item.lemma || ""}
            </div>

            <div class="tags">
                ${tags}
            </div>

            <div class="meta">

                <div>
                    <b>Песня:</b>
                    ${item.song || "—"}
                </div>

                <div>
                    <b>Альбом:</b>
                    ${item.album || "—"}
                </div>

                <div>
                    <b>Автор:</b>
                    ${item.author || "—"}
                </div>

            </div>

            <div class="kwic">

                <div class="short-kwic">
                    ${buildKWIC(
                        item.context,
                        item.word
                    )}
                </div>

                <div class="full-context hidden">
                    ${formatFullContext(
                        item.context,
                        item.word
                    )}
                </div>

                <button class="context-button">
                    Показать полный контекст
                </button>

            </div>
        `;

        container.appendChild(card);
    });
}

/* =========================
   ENTER KEY SEARCH
========================= */

document
    .getElementById("searchInput")
    .addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            searchCorpus();
        }
    });

/* =========================
   CONTEXT BUTTON
========================= */

document.addEventListener("click", function(event) {

    if (
        event.target.classList.contains(
            "context-button"
        )
    ) {

        const button = event.target;

        const fullContext =
            button.parentElement.querySelector(
                ".full-context"
            );

        if (
            fullContext.classList.contains("hidden")
        ) {

            fullContext.classList.remove("hidden");

            button.innerText =
                "Скрыть полный контекст";

        } else {

            fullContext.classList.add("hidden");

            button.innerText =
                "Показать полный контекст";
        }
    }
});