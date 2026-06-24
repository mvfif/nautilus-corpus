console.log("JS loaded");

let corpusData = [];

let currentResults = [];

let currentPage = 1;

const RESULTS_PER_PAGE = 50;

/* =========================
   NORMALIZATION
========================= */

function normalize(text) {

    return (text || "")
        .toLowerCase()
        .replace(/ё/g, "е")
        .trim();
}
function escapeRegExp(text) {
    return text.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}
/* =========================
   FILTERS
========================= */
const SORT_ORDERS = {

    pos: [
        "NOUN",
        "ADJF",
        "ADJS",
        "NUMR",
        "VERB",
        "INFN",
        "ADVB",
        "PRED",
        "PRTF",
        "PRTS",
        "GRND",
        "NPRO",
        "APRO",
        "PREP",
        "CONJ",
        "PRCL",
        "INTJ"
    ],

    case: [
        "nomn",
        "gent",
        "datv",
        "accs",
        "ablt",
        "loct"
    ],

    number: [
        "sing",
        "plur"
    ],

    gender: [
        "masc",
        "femn",
        "neut"
    ],
    animacy: [
        "anim",
        "inan"
    ],

    tense: [
        "past",
        "pres",
        "futr"
    ],

    aspect: [
        "impf",
        "perf"
    ],

    person: [
        "1per",
        "2per",
        "3per"
    ],

    mood: [
        "indc",
        "impr"
    ],

    voice: [
        "actv",
        "pssv"
    ],

    краткость: [
        "full",
        "short"
    ],

    степень: [
        "comp",
    ]
};

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
    "степень",
    "краткость",
    "author",
    "album",
    "song",
];

/* =========================
   GRAMMAR LABELS
========================= */

const grammarMap = {

    /* POS */

    "NOUN": "существительное",
    "ADJF": "прилагательное",
    "ADJS": "прилагательное",
    "NUMR": "числительное",
    "VERB": "глагол",
    "INFN": "инфинитив",
    "PRTF": "причастие",
    "PRTS": "причастие",
    "GRND": "деепричастие",
    "ADVB": "наречие",
    "NPRO": "местоимение",
    "APRO": "мест-прил",
    "PRED": "предикатив",
    "PREP": "предлог",
    "CONJ": "союз",
    "PRCL": "частица",
    "INTJ": "междометие",
    "full": "полное",
    "short": "краткое",
    "comp": "сравнительная",

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

    /* ANIMACY */

    "inan": "неодушевленное",
    "anim": "одушевленное",

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

        const container =
            document.getElementById(field);

        if (!container) return;

        let values = [

            ...new Set(

                corpusData
                    .map(item => item[field])
                    .filter(value =>
                        value &&
                        value !== ""
                    )
            )
        ];

        if (SORT_ORDERS[field]) {

            values.sort((a, b) => {

                const ai =
                    SORT_ORDERS[field].indexOf(a);

                const bi =
                    SORT_ORDERS[field].indexOf(b);

                if (ai === -1 && bi === -1)
                    return a.localeCompare(b);

                if (ai === -1)
                    return 1;

                if (bi === -1)
                    return -1;

                return ai - bi;
            });

        } else if (field === "year") {

            values.sort(
                (a, b) =>
                    Number(a) - Number(b)
            );

        } else {

            values.sort((a, b) =>
                a.localeCompare(
                    b,
                    "ru"
                )
            );
        }

        values.forEach(value => {

            const label =
                document.createElement("label");

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
   GET SELECTED
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
function updateSearchPlaceholder() {

    const mode = document.querySelector(
        'input[name="searchMode"]:checked'
    ).value;

    const input =
        document.getElementById("searchInput");

    if (mode === "lemma") {

        input.placeholder =
            "Введите лемму";

    } else {

        input.placeholder =
            "Введите словоформу";
    }
}

updateSearchPlaceholder();

function searchCorpus() {

    const query = normalize(

        document.getElementById(
            "searchInput"
        ).value
    );

    const mode = document.querySelector(
        'input[name="searchMode"]:checked'
    ).value;
    const minYear = parseInt(document.getElementById("yearMin").value);
    const maxYear = parseInt(document.getElementById("yearMax").value);

    let results = corpusData.filter(item => {

        /* SEARCH MODE */

        if (query !== "") {

            const target = normalize(
                mode === "lemma"
                    ? item.lemma
                    : item.word
            );

            if (target !== query) {
                return false;
            }

        }


        /* FILTERS */

        for (let field of FILTERS) {

            const selected =
                getSelected(field);

            if (selected.length > 0) {

                if (
                    !selected.includes(
                        item[field]
                    )
                ) {
                    return false;
                }
            }
            const year = parseInt(item.year);

            if (
                !isNaN(year) &&
                (year < minYear || year > maxYear)
            ) {
                return false;
            }
        }

        return true;
    });

    currentResults = results;

    currentPage = 1;

    document.getElementById(
        "searchResultsArea"
    ).style.display = "block";

    renderResults();
    renderFrequencyTable();
}

/* =========================
   SHORT KWIC
========================= */

function buildKWIC(text, word) {

    if (!text || !word) return "";

    const lines = text.split(/<br\s*\/?>|\n/);

    const escapedWord =
        escapeRegExp(word);

    const regex =
        new RegExp(
            `(^|[^А-Яа-яЁё])(${escapedWord})(?=[^А-Яа-яЁё]|$)`,
            "i"
        );

    const foundLine =
        lines.find(line => regex.test(line));

    if (!foundLine) {
        return lines[0] || "";
    }

    return `... ${foundLine.replace(
        regex,
        '$1<span class="highlight">$2</span>'
    )} ...`;
}
/* =========================
   FULL CONTEXT
========================= */

function formatFullContext(text, word) {

    if (!text) return "";

    const escapedWord =
        escapeRegExp(word);

    const regex =
        new RegExp(
            `(^|[^А-Яа-яЁё])(${escapedWord})(?=[^А-Яа-яЁё]|$)`,
            "gi"
        );

    return text.replace(
        regex,
        '$1<span class="highlight">$2</span>'
    );
}

/* =========================
   RENDER RESULTS
========================= */

function renderResults() {

    const container =
        document.getElementById("results");

    const count =
        document.getElementById(
            "resultsCount"
        );

    container.innerHTML = "";

    count.innerText =
        `Найдено: ${currentResults.length}`;

    if (currentResults.length === 0) {

        container.innerHTML = `

            <div class="result-card">
                Ничего не найдено
            </div>
        `;

        return;
    }

    const start =
        (currentPage - 1)
        * RESULTS_PER_PAGE;

    const end =
        start + RESULTS_PER_PAGE;

    const visible =
        currentResults.slice(start, end);

    visible.forEach(item => {

        const card =
            document.createElement("div");

        card.className =
            "result-card";

        /* TAGS */

        const tags = [

            item.pos,
            item.case,
            item.number,
            item.gender,
            item.animacy,
            item.tense,
            item.aspect,
            item.person,
            item.mood,
            item.voice,
            item.краткость,
            item.степень

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

                <div>
                    <b>Год:</b>
                    ${item.year || "—"}
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
    /* =========================
       PAGINATION
    ========================= */

    const totalPages = Math.ceil(
        currentResults.length / RESULTS_PER_PAGE
    );

    if (totalPages > 1) {

        const pagination =
            document.createElement("div");

        pagination.className = "pagination";

        /* PREVIOUS */

        const prevButton =
            document.createElement("button");

        prevButton.innerText =
            "← Предыдущая";

        prevButton.className =
            "page-button";

        prevButton.disabled =
            currentPage === 1;

        prevButton.onclick = function () {

            if (currentPage > 1) {

                currentPage--;

                renderResults();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        };

        pagination.appendChild(prevButton);

        /* PAGE ARRAY */

        let pages = [];

        if (totalPages <= 7) {

            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }

        } else {

            pages.push(1);

            if (currentPage > 4) {
                pages.push("...");
            }

            let start =
                Math.max(2, currentPage - 1);

            let end =
                Math.min(
                    totalPages - 1,
                    currentPage + 1
                );

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 3) {
                pages.push("...");
            }

            pages.push(totalPages);
        }

        /* RENDER PAGES */

        pages.forEach(page => {

            if (page === "...") {

                const dots =
                    document.createElement("span");

                dots.className =
                    "pagination-dots";

                dots.innerText = "...";

                pagination.appendChild(dots);

            } else {

                const button =
                    document.createElement("button");

                button.innerText = page;

                button.className =
                    "page-button";

                if (page === currentPage) {
                    button.classList.add("active");
                }

                button.onclick = function () {

                    currentPage = page;

                    renderResults();

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                };

                pagination.appendChild(button);
            }
        });

        /* NEXT */

        const nextButton =
            document.createElement("button");

        nextButton.innerText =
            "Следующая →";

        nextButton.className =
            "page-button";

        nextButton.disabled =
            currentPage === totalPages;

        nextButton.onclick = function () {

            if (currentPage < totalPages) {

                currentPage++;

                renderResults();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        };

        pagination.appendChild(nextButton);

        container.appendChild(pagination);
    }
}

/* =========================
   ENTER KEY SEARCH
========================= */

document
    .getElementById("searchInput")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                searchCorpus();
            }
        }
    );

/* =========================
   CONTEXT BUTTON
========================= */

document.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList.contains(
                "context-button"
            )
        ) {

            const button =
                event.target;

            const fullContext =

                button.parentElement.querySelector(
                    ".full-context"
                );

            if (
                fullContext.classList.contains(
                    "hidden"
                )
            ) {

                fullContext.classList.remove(
                    "hidden"
                );

                button.innerText =
                    "Скрыть полный контекст";

            } else {

                fullContext.classList.add(
                    "hidden"
                );

                button.innerText =
                    "Показать полный контекст";
            }
        }
    }
);

/* =========================
   COLLAPSIBLE FILTERS
========================= */

document.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList.contains(
                "filter-title"
            )
        ) {

            const group =
                event.target.parentElement;

            group.classList.toggle(
                "active"
            );
        }
    }
);
function resetFilters() {

    // очищаем поиск

    document.getElementById(
        "searchInput"
    ).value = "";

    // возвращаем поиск по лемме

    document.querySelector(
        'input[value="lemma"]'
    ).checked = true;

    updateSearchPlaceholder();

    // снимаем все чекбоксы

    document
        .querySelectorAll(
            '.filter-content input[type="checkbox"]'
        )
        .forEach(cb => {

            cb.checked = false;
        });

    // очищаем результаты

    document.getElementById(
        "results"
    ).innerHTML = "";

    document.getElementById(
        "resultsCount"
    ).textContent = "";

    document.getElementById(
    "searchResultsArea"
    ).style.display = "none";
}
document
.querySelectorAll(
    'input[name="searchMode"]'
)
.forEach(radio => {

    radio.addEventListener(
        "change",
        updateSearchPlaceholder
    );
});
const yearMin =
    document.getElementById("yearMin");

const yearMax =
    document.getElementById("yearMax");

const yearMinLabel =
    document.getElementById("yearMinLabel");

const yearMaxLabel =
    document.getElementById("yearMaxLabel");

const sliderRange =
    document.getElementById("sliderRange");

function updateYearSlider() {

    let min =
        parseInt(yearMin.value);

    let max =
        parseInt(yearMax.value);

    if (min > max) {
        [min, max] = [max, min];

        yearMin.value = min;
        yearMax.value = max;
    }

    yearMinLabel.textContent = min;
    yearMaxLabel.textContent = max;

    const percentMin =
        ((min - 1983) / (1997 - 1983)) * 100;

    const percentMax =
        ((max - 1983) / (1997 - 1983)) * 100;

    sliderRange.style.left =
        percentMin + "%";

    sliderRange.style.width =
        (percentMax - percentMin) + "%";
}

yearMin.addEventListener(
    "input",
    updateYearSlider
);

yearMax.addEventListener(
    "input",
    updateYearSlider
);

updateYearSlider();

document
    .querySelectorAll(".tab-button")
    .forEach(button => {

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".tab-button")
                .forEach(btn =>
                    btn.classList.remove("active")
                );

            button.classList.add("active");

            const tab =
                button.dataset.tab;

            document.getElementById(
                "kwicTab"
            ).style.display =
                tab === "kwic"
                    ? "block"
                    : "none";

            document.getElementById(
                "freqTab"
            ).style.display =
                tab === "freq"
                    ? "block"
                    : "none";
        });

    });

function renderFrequencyTable() {

    const freq = {};

    currentResults.forEach(item => {

        const lemma = item.lemma;

        if (!lemma) return;

        freq[lemma] =
            (freq[lemma] || 0) + 1;
    });

    const corpusSize =
        corpusData.length;

    const rows =
        Object.entries(freq)

        .map(([lemma, count]) => ({

            lemma,

            count,

            ipm:
                (
                    count /
                    corpusSize *
                    1000000
                ).toFixed(2)
        }))

        .sort(
            (a, b) =>
                b.count - a.count
        );

    const container =
        document.getElementById(
            "frequencyTable"
        );

    container.innerHTML = `

        <table class="freq-table">

            <thead>

                <tr>

                    <th>Лемма</th>

                    <th>Количество вхождений</th>

                    <th>ipm</th>

                </tr>

            </thead>

            <tbody>

                ${rows.map(row => `

                    <tr>

                        <td>${row.lemma}</td>

                        <td>${row.count}</td>

                        <td>${row.ipm}</td>

                    </tr>

                `).join("")}

            </tbody>

        </table>
    `;
}