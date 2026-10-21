const app = document.getElementById("app");

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  node.append(...children.filter((c) => c != null));
  return node;
}

const DEVANAGARI = /[ऀ-ॿ]/;

function textEl(text, cls) {
  return el("div", { class: DEVANAGARI.test(text) ? `${cls} deva` : cls }, text);
}

function shuffled(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function showMenu() {
  document.title = "Memo Cards";
  const files = await loadJson("data/manifest.json");
  const decks = await Promise.all(
    files.map(async (file) => ({ id: file.replace(/\.json$/, ""), ...(await loadJson(`data/${file}`)) }))
  );
  app.replaceChildren(
    el("h1", {}, "Memo Cards"),
    el(
      "nav",
      { class: "menu" },
      ...decks.map((deck) =>
        el(
          "a",
          { href: `#${deck.id}` },
          el("strong", {}, deck.title),
          el("span", { class: "muted" }, `${deck.cards.length} cards${deck.description ? " · " + deck.description : ""}`)
        )
      )
    )
  );
}

async function showDeck(id) {
  const deck = await loadJson(`data/${id}.json`);
  document.title = `${deck.title} · Memo Cards`;

  let cards = deck.cards;
  let index = 0;
  let flipped = false;

  const render = () => {
    const card = cards[index];
    const face = flipped
      ? [
          ...[card.back].flat().map((text, i) => textEl(text, i === 0 ? "main" : "main sub")),
          card.note ? textEl(card.note, "note") : null,
        ]
      : [textEl(card.front, "main")];

    app.replaceChildren(
      el(
        "div",
        { class: "bar" },
        el("a", { class: "btn", href: "#" }, "← Menu"),
        el("strong", {}, deck.title),
        el(
          "button",
          {
            onclick: () => {
              cards = shuffled(cards);
              index = 0;
              flipped = false;
              render();
            },
          },
          "Shuffle"
        )
      ),
      el("div", { class: "card", ...swipeHandlers() }, ...face),
      el(
        "div",
        { class: "controls" },
        el("button", { onclick: () => step(-1) }, "Prev"),
        el("span", { class: "count" }, `${index + 1} / ${cards.length}`),
        el("button", { onclick: () => step(1) }, "Next")
      )
    );
  };

  // swipe left = next, swipe right = prev, tap = flip
  const SWIPE_MIN = 50;
  const swipeHandlers = () => {
    let start = null;
    return {
      onpointerdown: (event) => {
        start = { x: event.clientX, y: event.clientY };
      },
      onpointercancel: () => {
        start = null;
      },
      onpointerup: (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        start = null;
        if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
          step(dx < 0 ? 1 : -1);
        } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          flipped = !flipped;
          render();
        }
      },
    };
  };

  const step = (delta) => {
    index = (index + delta + cards.length) % cards.length;
    flipped = false;
    render();
  };

  deckKeyHandler = (event) => {
    if (event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowLeft") step(-1);
    else if (event.key === " ") {
      event.preventDefault();
      flipped = !flipped;
      render();
    }
  };

  render();
}

let deckKeyHandler = null;
window.addEventListener("keydown", (event) => deckKeyHandler?.(event));

async function route() {
  deckKeyHandler = null;
  const id = decodeURIComponent(location.hash.slice(1));
  try {
    if (id) await showDeck(id);
    else await showMenu();
  } catch (err) {
    app.replaceChildren(el("p", { class: "muted" }, `Failed to load: ${err.message}`), el("a", { class: "btn", href: "#" }, "← Menu"));
  }
}

window.addEventListener("hashchange", route);
route();
