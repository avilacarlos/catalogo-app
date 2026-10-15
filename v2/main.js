/* =========================================================
   ART & PRINT — CATÁLOGO DE VERSOS V2 — MVP
   =========================================================
   Flujo:
   /slug -> evento -> categoría -> versos -> favoritos/selección

   IMPORTANTE:
   - Para este MVP RLS está desactivado, como se acordó.
   - Usa solamente la publishable/anon key, NUNCA service_role.
   - Antes de producción habrá que implementar RLS.
   ========================================================= */

const SUPABASE_URL = "https://udwzfzmuhakscoehfzqq.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkd3pmem11aGFrc2NvZWhmenFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0Nzg1MTUsImV4cCI6MjEwNTA1NDUxNX0.PhaCm3rRHr02DUC3NrOdh2jNvYrgrh0EwONLMIXCnYk";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const state = {
  event: null,
  category: null,
  verses: [],
  favorites: new Set(),
  selectedVerseId: null,
  currentView: "home",
  currentVerseIndex: 0,
};

const app = document.getElementById("app");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  renderLoading();

  const slug = getEventSlug();

  if (!slug) {
    renderError(
      "Catálogo no especificado",
      "Abre el enlace personalizado que te proporcionó Art & Print.",
    );
    return;
  }

  await loadCatalog(slug);
}

function getEventSlug() {
  const params = new URLSearchParams(window.location.search);
  const segments = window.location.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  // Permite probar la V2 localmente en /v2/?slug=...
  if (segments[0] === "v2") {
    return segments[1] || params.get("slug") || null;
  }

  return segments[0] || params.get("slug") || null;
}

/* ========================= DATA ========================= */

async function loadCatalog(slug) {
  try {
    const { data: event, error } = await supabaseClient
      .from("eventos")
      .select(
        `
        id,
        cliente_id,
        categoria_id,
        festejado,
        slug,
        estado,
        notas,
        clientes (
          nombre
        ),
        categorias_verso (
          id,
          nombre,
          slug
        )
      `,
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;

    if (!event) {
      renderError(
        "Catálogo no encontrado",
        "El enlace no corresponde a un catálogo disponible.",
      );
      return;
    }

    if (event.estado === "borrador") {
      renderError(
        "Catálogo en preparación",
        "Este catálogo todavía no está disponible.",
      );
      return;
    }

    if (event.estado === "cerrado" || event.estado === "archivado") {
      renderError(
        "Catálogo no disponible",
        "Este catálogo ya no se encuentra disponible para consulta.",
      );
      return;
    }

    state.event = event;
    state.category = event.categorias_verso;

    await Promise.all([loadVerses(), loadFavorites(), loadSelection()]);

    render();
  } catch (error) {
    console.error(error);
    renderError("No pudimos cargar el catálogo", getFriendlyError(error));
  }
}

async function loadVerses() {
  const categoryName = state.category?.nombre;
  if (!categoryName)
    throw new Error("El evento no tiene una categoría válida.");

  /*
    TRANSICIÓN:
    La tabla "versos" actual todavía utiliza texto en "categoria".
    Después de migrarla, esta consulta cambiará a:
    .eq('categoria_id', state.event.categoria_id)
  */
  const { data, error } = await supabaseClient
    .from("versos")
    // Compatibilidad con la tabla actual: categoria/codigo/contenido.
    // ilike evita problemas por "boda" vs "Boda".
    .select("id, categoria, codigo, contenido")
    .order("id", { ascending: true });

  if (error) throw error;
  const acceptedCategories = legacyCategoryAliases(state.category);
  state.verses = (data || []).filter((verse) =>
    acceptedCategories.has(normalizeCategory(verse.categoria)),
  );
}

function legacyCategoryAliases(category) {
  const slug = normalizeCategory(category?.slug);
  const name = normalizeCategory(category?.nombre);
  const aliases = new Set([name, slug]);

  if (slug.includes("xv") || name.includes("xv")) {
    aliases.add("xv");
    aliases.add("xv anos");
  }
  if (slug.includes("boda") || name.includes("boda")) aliases.add("boda");
  if (slug.includes("baut") || name.includes("baut")) aliases.add("bautizo");
  if (slug.includes("esquel") || name.includes("esquel") || slug === "varios") {
    aliases.add("varios");
    aliases.add("esquelas");
  }

  return aliases;
}

function normalizeCategory(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function loadFavorites() {
  const { data, error } = await supabaseClient
    .from("favoritos")
    .select("verso_id")
    .eq("evento_id", state.event.id);

  if (error) throw error;
  state.favorites = new Set((data || []).map((x) => Number(x.verso_id)));
}

async function loadSelection() {
  const { data, error } = await supabaseClient
    .from("selecciones")
    .select("id, verso_id, estado")
    .eq("evento_id", state.event.id)
    .maybeSingle();

  if (error) throw error;
  state.selectedVerseId = data?.verso_id ? Number(data.verso_id) : null;
}

/* ========================= VIEWS ========================= */

function render() {
  const isHome = state.currentView === "home";
  document.body.classList.toggle("is-home", isHome);
  document.documentElement.classList.toggle("is-home", isHome);

  if (state.currentView === "home") return renderHome();
  if (state.currentView === "list") return renderList();
  if (state.currentView === "verse") return renderVerse();
  if (state.currentView === "favorites") return renderFavorites();
  if (state.currentView === "confirmation") return renderConfirmation();
}

function baseLayout(content) {
  const isHome = state.currentView === "home";

  if (isHome) {
    app.innerHTML = `
      <div class="app-shell is-home relative mx-auto h-[100svh] max-h-[100svh] overflow-hidden flex flex-col justify-between">
        <div class="ap-background"></div>
        <main class="relative  z-10 flex h-full flex-col justify-between items-center text-center px-4 pt-3 sm:pt-4 pb-8 sm:pb-10 view-enter" style="padding-bottom: max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem));">
          ${content}
        </main>
      </div>
    `;
    bindActions();
    return;
  }

  app.innerHTML = `
    <div class="app-shell relative mx-auto min-h-[100svh] overflow-x-hidden">
      ${
        state.currentView !== "list" && state.currentView !== "favorites"
          ? `
      <div class="relative z-10 flex items-center justify-center pt-2">
        <img src="./assets/logo.webp" alt="Art & Print" class="h-20 sm:h-24 w-auto object-contain">
      </div>
      `
          : ""
      }

      <main class="relative z-10 view-enter px-4 pb-28 pt-2">${content}</main>
      ${bottomNav()}
    </div>
  `;

  bindActions();
}

function bottomNav() {
  return `
    <nav class="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[520px] border-t border-ap-line/80 bg-white/90 px-3 pb-[calc(.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      <div class="grid grid-cols-3 gap-2">
        <button data-nav="list" class="nav-item ${state.currentView === "list" ? "text-ap-rose" : "text-slate-500"}">
          ${icon("book", "h-5 w-5")}<span>Versos</span>
        </button>
        <button data-nav="favorites" class="nav-item ${state.currentView === "favorites" ? "text-ap-rose" : "text-slate-500"}">
          ${icon("heart", "h-5 w-5")}<span>Favoritos</span>
        </button>
        <button data-nav="home" class="nav-item ${state.currentView === "home" ? "text-ap-rose" : "text-slate-500"}">
          ${icon("info", "h-5 w-5")}<span>Información</span>
        </button>
      </div>
    </nav>
  `;
}

function renderHome() {
  const displayName =
    state.event.festejado || state.event.clientes?.nombre || "";
  const categoryTitle = state.category?.nombre || "Boda";
  const illustrationSrc = getCategoryIllustration(state.category);

  baseLayout(`
    <!-- 1. HEADER: Logo grande y slogan -->
    <header class="flex flex-col items-center justify-center pt-1 shrink-0 py-4">
      <img
        src="./assets/logo.webp"
        alt="Art & Print"
        style="width: 75vw;  height: auto; max-height: 35svh; object-fit: contain;"
        class="drop-shadow-sm select-none"
      >
      <p class="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[#635c67] leading-tight text-center py-2">
        PAPELERÍA QUE HACE HISTORIAS
      </p>
    </header>

    <!-- 2. GREETING & DETALLES DEL EVENTO -->
    <div class="my-auto flex flex-col items-center justify-center px-2 py-1 gap-2 shrink-0 ">
      <p class="font-display text-[#b9637c] leading-none font-normal pin" style="font-size: clamp(1.75rem, 5.5vw, 2.3rem);">
        Hola,
      </p>
      <h1 class="font-display text-[#b9637c] pin font-normal leading-none mt-1 text-center" style="font-size: 12vw;">
        ${escapeHTML(displayName)}
      </h1>
<img
        src="./assets/separador.webp"
        alt="Art & Print"
        style="width:60vw;  height: auto; max-height: 35svh; object-fit: contain;"
        class="drop-shadow-sm select-none pt-2"
      >
      <p class="mt-2 font-sans text-[clamp(14px,4.5vw,22px)]  text-[#5f5863] leading-relaxed text-center ">
        Hemos preparado una selección de <br> versos para su invitación de <span class="text-[#b9637c]">${escapeHTML(categoryTitle)}</span>
      </p>

    
    
      

    <!-- 3. ILUSTRACIÓN (BODA.WEBP) + BOTÓN COMENZAR -->
    <div class="flex flex-col items-center justify-center w-full shrink-0 pb-1 gap-2">
      <img
        src="${illustrationSrc}"
        alt="${escapeHTML(categoryTitle)}"
        style="width: 75%; height: auto; max-height: 25svh; object-fit: contain;"
        class="drop-shadow-sm select-none pointer-events-none "
      >

      <button
        data-action="start"
        style="width: 78vw; max-width: 280px; padding: 13px 28px;"
        class="rounded-2xl bg-[#b9637c] hover:bg-[#a34f67] active:scale-[0.98] transition-all text-white font-sans text-base sm:text-lg font-medium shadow-soft flex items-center justify-center gap-3">
        Comenzar ${icon("arrow-right", "h-5 w-5")}
      </button>
    </div>
  `);
}

function renderList() {
  const cards = state.verses
    .map((verse, index) => {
      const favorite = state.favorites.has(Number(verse.id));
      const adornment = index % 2 === 0 ? "./assets/a01.webp" : "./assets/a02.webp";

      return `
      <article class="relative overflow-hidden rounded-3xl border border-ap-line bg-white/75 p-5 shadow-card backdrop-blur-sm">
        <img
          src="${adornment}"
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute bottom-[0rem] left-[-10%] z-0 w-[10rem] sm:w-[12rem] h-auto select-none object-contain opacity-20"
        >

        <div class="relative z-10 flex items-start justify-between gap-3">
          <span class="font-sans text-xs font-bold tracking-[.18em] text-ap-roseDark">
            ${escapeHTML(verse.codigo)}
          </span>

          <button data-favorite="${verse.id}"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ap-line bg-white/80 text-ap-rose"
            aria-label="${favorite ? "Quitar de favoritos" : "Guardar en favoritos"}">
            ${icon("heart", `h-5 w-5 ${favorite ? "fill-current" : ""}`)}
          </button>
        </div>


        <div class="relative z-10 ml-10 flex flex-col items-center text-center">
        <p class="verse-preview mt-4 w-full text-center font-display text-[6vw] leading-7 italic text-slate-700 sla">
          “${escapeHTML(verse.contenido)}”
        </p>

        <button data-open-verse="${index}"
          class="mt-5 flex w-fit self-end items-center justify-center gap-2 rounded-full bg-ap-blush px-5 py-3 font-display text-base text-ap-roseDark hover:bg-ap-rose hover:text-white pin">
          Ver completo ${icon("arrow-right", "h-4 w-4")}
        </button>
        </div>
      </article>
    `;
    })
    .join("");

  baseLayout(`
    <section>
      <div class="text-center">
        <h1 class="mt-2 font-display text-4xl text-ap-ink">
          Versos para su ${escapeHTML(categoryArticle(state.category.nombre))}
        </h1>

        <div class="my-4 flex items-center justify-center gap-3 text-ap-gold">
          <img
        src="./assets/separador.webp"
        alt="Art & Print"
        style="width:50vw;  height: auto; max-height: 35svh; object-fit: contain;"
        class="drop-shadow-sm select-none "
      >
        </div>

        <p class="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[#635c67] leading-tight text-center ">
        Palabras que hacen <br> historias eternas
      </p>
        
        
      </div>

      <div class="mt-7 flex items-center justify-between">
        <div class="flex rounded-full bg-white/70 p-1 shadow-sm">
          <button class="rounded-full bg-ap-rose px-4 py-2 text-xs font-semibold text-white">Todos</button>
          <button data-nav="favorites" class="rounded-full px-4 py-2 text-xs font-semibold text-slate-600">
            Favoritos ${state.favorites.size ? `(${state.favorites.size})` : ""}
          </button>
        </div>

        <span class="text-xs font-medium text-slate-500">
          01 — ${String(state.verses.length).padStart(2, "0")}
        </span>
      </div>

      <div class="mt-4 space-y-4">
        ${cards || emptyState("No hay versos disponibles para esta categoría.")}
      </div>
    </section>
  `);
}

function renderVerse() {
  const verse = state.verses[state.currentVerseIndex];

  if (!verse) {
    state.currentView = "list";
    return render();
  }

  const favorite = state.favorites.has(Number(verse.id));
  const selected = Number(state.selectedVerseId) === Number(verse.id);

  baseLayout(`
    <section class="flex min-h-[calc(100svh-9rem)] flex-col">
      <div class="text-center">
        <p class="mt-2 text-xs tracking-[.25em] text-ap-roseDark">
          ${String(state.currentVerseIndex + 1).padStart(2, "0")} /
          ${String(state.verses.length).padStart(2, "0")}
        </p>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <span class="rounded-full bg-ap-blush px-5 py-2 font-sans text-xs font-bold tracking-[.18em] text-ap-roseDark">
          ${escapeHTML(verse.codigo)}
        </span>

        <blockquote class="verse-content mt-9 max-w-[350px] font-display text-3xl leading-[1.35] italic text-ap-ink">
          “${escapeHTML(verse.contenido)}”
        </blockquote>

        <div class="my-9 flex items-center gap-3 text-ap-gold">
          <span class="h-px w-12 bg-ap-gold/50"></span>
          ${icon("heart", "h-4 w-4 fill-current")}
          <span class="h-px w-12 bg-ap-gold/50"></span>
        </div>

        <button data-select-verse="${verse.id}"
          class="w-full max-w-[350px] rounded-full ${selected ? "bg-ap-sage" : "bg-ap-rose"} px-6 py-3.5 font-display text-lg text-white shadow-soft">
          ${selected ? "✓ Verso elegido" : "Seleccionar este verso"}
          ${selected ? "" : icon("arrow-right", "ml-1 inline h-5 w-5")}
        </button>

        <div class="mt-3 grid w-full max-w-[350px] grid-cols-2 gap-3">
          <button data-favorite="${verse.id}"
            class="flex items-center justify-center gap-2 rounded-full border border-ap-line bg-white/75 px-4 py-3 font-display text-base">
            ${icon("heart", `h-5 w-5 text-ap-rose ${favorite ? "fill-current" : ""}`)}
            ${favorite ? "Guardado" : "Guardar"}
          </button>

          <button data-share-verse="${verse.id}"
            class="flex items-center justify-center gap-2 rounded-full border border-ap-line bg-white/75 px-4 py-3 font-display text-base">
            ${icon("share", "h-5 w-5 text-ap-rose")} Compartir
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-ap-line/70 pt-4">
        <button data-prev-verse
          class="flex items-center gap-1 px-2 py-2 font-display text-sm text-slate-600 disabled:opacity-30"
          ${state.currentVerseIndex === 0 ? "disabled" : ""}>
          ${icon("arrow-left", "h-4 w-4")} Anterior
        </button>

        <button data-nav="list" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ap-rose">
          ${icon("grid", "h-5 w-5")}
        </button>

        <button data-next-verse
          class="flex items-center gap-1 px-2 py-2 font-display text-sm text-slate-600 disabled:opacity-30"
          ${state.currentVerseIndex === state.verses.length - 1 ? "disabled" : ""}>
          Siguiente ${icon("arrow-right", "h-4 w-4")}
        </button>
      </div>
    </section>
  `);
}

function renderFavorites() {
  const favoriteVerses = state.verses.filter((verse) =>
    state.favorites.has(Number(verse.id)),
  );

  const cards = favoriteVerses
    .map((verse, index) => {
      const originalIndex = state.verses.findIndex(
        (v) => Number(v.id) === Number(verse.id),
      );
      const adornment = index % 2 === 0 ? "./assets/a01.webp" : "./assets/a02.webp";

      return `
      <article class="relative overflow-hidden rounded-3xl border border-ap-line bg-white/80 p-5 shadow-card">
        <!-- Adorno floral esquina inferior izquierda -->
        <img
          src="${adornment}"
          alt=""
          aria-hidden="true"
         class="pointer-events-none absolute bottom-[0rem] left-[-10%] z-0 w-[10rem] sm:w-[12rem] h-auto select-none object-contain opacity-20"
        >

        <div class="relative z-10 flex items-start justify-between gap-3">
          <span class="font-sans text-xs font-bold tracking-[.18em] text-[#b9637c]">
            ${escapeHTML(verse.codigo)}
          </span>

          <button data-favorite="${verse.id}" class="text-[#b9637c]">
            ${icon("heart", "h-5 w-5 fill-current")}
          </button>
        </div>

        <div class="relative z-10 ml-12 flex flex-col items-center text-center">
         <p class="verse-preview mt-4 w-full text-center font-display text-[6vw] leading-7 italic text-slate-700 sla">
          “${escapeHTML(verse.contenido)}”
        </p>

          <button data-open-verse="${originalIndex}"
            class="mt-3 flex w-fit self-end items-center justify-center gap-2 rounded-full bg-[#f4e2e0] hover:bg-[#ebd5d3] px-5 py-2.5 font-display text-sm font-semibold text-[#b9637c] transition-colors shadow-sm pin py-2.5">
            Ver completo ${icon("arrow-right", "h-4 w-4")}
          </button>
        </div>
      </article>
    `;
    })
    .join("");

  baseLayout(`
    <section>
      <div class="text-center">
        <h1 class="mt-2 font-display text-4xl text-ap-ink">Mis favoritos</h1>
        <p class="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-slate-500">
          Aquí puedes revisar los versos que has guardado.
        </p>
      </div>

      <div class="mt-7 space-y-4">
        ${cards || emptyState("Todavía no has guardado ningún verso.")}
      </div>
    </section>
  `);
}

function renderConfirmation() {
  const verse = state.verses.find(
    (item) => Number(item.id) === Number(state.selectedVerseId),
  );

  baseLayout(`
    <section class="flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center text-center">
      <div class="flex h-24 w-24 items-center justify-center rounded-full border-2 border-ap-gold bg-white/60 text-ap-rose shadow-soft">
        ${icon("check", "h-12 w-12")}
      </div>

      <p class="mt-8 font-sans text-[10px] font-semibold tracking-[.35em] text-ap-sage">
        ${escapeHTML(state.category.nombre)}
      </p>

      <h1 class="mt-3 font-display text-4xl text-ap-ink">¡Verso elegido!</h1>

      <p class="mt-4 max-w-[310px] text-base leading-7 text-slate-600">
        El verso <strong class="font-semibold text-ap-roseDark">${escapeHTML(verse?.codigo || "")}</strong>
        se ha registrado para tu catálogo.
      </p>

      <div class="my-7 h-px w-28 bg-ap-gold/50"></div>

      <div class="max-w-[340px] rounded-3xl border border-white/80 bg-white/70 p-5 shadow-card">
        <p class="verse-content font-display text-lg italic leading-7 text-slate-700">
          “${escapeHTML(verse?.contenido || "")}”
        </p>
      </div>

      <button data-nav="favorites"
        class="mt-6 w-full max-w-[340px] rounded-full bg-ap-rose px-6 py-3.5 font-display text-lg text-white shadow-soft">
        Ver mis favoritos ${icon("arrow-right", "ml-1 inline h-5 w-5")}
      </button>

      <button data-nav="list"
        class="mt-3 w-full max-w-[340px] rounded-full border border-ap-line bg-white/70 px-6 py-3.5 font-display text-lg text-ap-roseDark">
        Seguir explorando
      </button>

      <p class="mt-10 font-display text-xl italic text-ap-sage">
        Gracias por dejarnos ser parte<br>de su historia.
      </p>
    </section>
  `);
}

/* ========================= ACTIONS ========================= */

function bindActions() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.nav;
      render();
    });
  });

  document
    .querySelector('[data-action="start"]')
    ?.addEventListener("click", () => {
      state.currentView = "list";
      render();
    });

  document.querySelectorAll("[data-open-verse]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentVerseIndex = Number(button.dataset.openVerse);
      state.currentView = "verse";
      render();
    });
  });

  document.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", () =>
      toggleFavorite(Number(button.dataset.favorite)),
    );
  });

  document.querySelectorAll("[data-select-verse]").forEach((button) => {
    button.addEventListener("click", () =>
      selectVerse(Number(button.dataset.selectVerse)),
    );
  });

  document.querySelectorAll("[data-share-verse]").forEach((button) => {
    button.addEventListener("click", () =>
      shareVerse(Number(button.dataset.shareVerse)),
    );
  });

  document.querySelector("[data-prev-verse]")?.addEventListener("click", () => {
    if (state.currentVerseIndex > 0) {
      state.currentVerseIndex--;
      render();
    }
  });

  document.querySelector("[data-next-verse]")?.addEventListener("click", () => {
    if (state.currentVerseIndex < state.verses.length - 1) {
      state.currentVerseIndex++;
      render();
    }
  });
}

async function toggleFavorite(verseId) {
  const wasFavorite = state.favorites.has(verseId);

  try {
    if (wasFavorite) {
      const { error } = await supabaseClient
        .from("favoritos")
        .delete()
        .eq("evento_id", state.event.id)
        .eq("verso_id", verseId);

      if (error) throw error;
      state.favorites.delete(verseId);
    } else {
      const { error } = await supabaseClient.from("favoritos").insert({
        evento_id: state.event.id,
        verso_id: verseId,
      });

      if (error) throw error;
      state.favorites.add(verseId);
    }

    render();
  } catch (error) {
    console.error(error);
    toast("No pudimos actualizar tus favoritos.");
  }
}

async function selectVerse(verseId) {
  try {
    const { error } = await supabaseClient.from("selecciones").upsert(
      {
        evento_id: state.event.id,
        verso_id: verseId,
        estado: "seleccionado",
      },
      { onConflict: "evento_id" },
    );

    if (error) throw error;

    state.selectedVerseId = verseId;
    state.currentView = "confirmation";
    render();
  } catch (error) {
    console.error(error);
    toast("No pudimos guardar la selección.");
  }
}

async function shareVerse(verseId) {
  const verse = state.verses.find(
    (item) => Number(item.id) === Number(verseId),
  );
  if (!verse) return;

  const text = `${verse.codigo}

“${verse.contenido}”

Elegido de nuestro catálogo de versos de Art & Print.`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: `Verso ${verse.codigo} · Art & Print`,
        text,
      });
      return;
    }

    await navigator.clipboard.writeText(text);
    toast("Verso copiado. Puedes pegarlo donde quieras.");
  } catch (error) {
    if (error?.name !== "AbortError") {
      try {
        await navigator.clipboard.writeText(text);
        toast("Verso copiado al portapapeles.");
      } catch {
        toast("No fue posible compartir el verso.");
      }
    }
  }
}

/* ========================= UI HELPERS ========================= */

function renderLoading() {
  app.innerHTML = `
    <div class="app-shell flex min-h-[100svh] items-center justify-center">
      <div class="flex flex-col items-center text-center">
        <div class="loader-ring"></div>
        <p class="mt-5 font-display text-2xl text-ap-roseDark">Preparando tu catálogo...</p>
        <p class="mt-2 text-sm text-slate-500">Un momento, por favor.</p>
      </div>
    </div>
  `;
}

function renderError(title, message) {
  app.innerHTML = `
    <div class="app-shell flex min-h-[100svh] items-center justify-center px-6">
      <section class="w-full max-w-[420px] rounded-[2rem] border border-ap-line bg-white/80 p-8 text-center shadow-soft">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ap-blush text-ap-rose">
          ${icon("info", "h-7 w-7")}
        </div>
        <h1 class="mt-6 font-display text-3xl text-ap-ink">${escapeHTML(title)}</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">${escapeHTML(message)}</p>
        <p class="mt-8 font-sans text-[10px] font-semibold tracking-[.3em] text-ap-sage">ART & PRINT</p>
      </section>
    </div>
  `;
}

function emptyState(message) {
  return `
    <div class="rounded-3xl border border-dashed border-ap-line bg-white/50 p-8 text-center">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ap-blush text-ap-rose">
        ${icon("heart", "h-5 w-5")}
      </div>
      <p class="mt-4 text-sm leading-6 text-slate-500">${escapeHTML(message)}</p>
    </div>
  `;
}

function toast(message) {
  document.getElementById("ap-toast")?.remove();

  const el = document.createElement("div");
  el.id = "ap-toast";
  el.className =
    "fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-ap-ink px-5 py-3 text-center text-sm text-white shadow-soft";
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2600);
}

function getCategoryIllustration(category) {
  const slug = normalizeCategory(category?.slug || category?.nombre || "");
  if (slug.includes("xv")) return "./assets/xv.webp";
  if (slug.includes("baut")) return "./assets/bautizo.webp";
  if (slug.includes("esquel") || slug.includes("rip") || slug === "varios")
    return "./assets/rip.webp";
  return "./assets/boda.webp";
}

function categoryArticle(category) {
  const normalized = String(category || "").toLowerCase();
  if (normalized.includes("xv")) return "XV Años";
  if (normalized.includes("baut")) return "Bautizo";
  if (normalized.includes("esquel")) return "Esquelas";
  return category;
}

function eventArticle(category) {
  const normalized = String(category || "").toLowerCase();
  if (normalized.includes("boda")) return "la Boda";
  if (normalized.includes("xv")) return "los XV Años";
  if (normalized.includes("esquel")) return "las Esquelas";
  return `el ${category}`;
}

function getFriendlyError(error) {
  return (
    error?.message || "Ocurrió un error inesperado al consultar el catálogo."
  );
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ========================= SVG ICONS ========================= */

function icon(name, className = "h-6 w-6") {
  const common = `class="${className}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;

  const paths = {
    menu: `<svg ${common} viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
    home: `<svg ${common} viewBox="0 0 24 24"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>`,
    "arrow-left": `<svg ${common} viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/><path d="M9 12h12"/></svg>`,
    "arrow-right": `<svg ${common} viewBox="0 0 24 24"><path d="M3 12h18"/><path d="m13 6 6 6-6 6"/></svg>`,
    heart: `<svg ${common} viewBox="0 0 24 24"><path d="M20.8 8.6c0 5.1-8.8 10.2-8.8 10.2S3.2 13.7 3.2 8.6A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 8.8 2.5Z"/></svg>`,
    book: `<svg ${common} viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>`,
    info: `<svg ${common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>`,
    share: `<svg ${common} viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>`,
    grid: `<svg ${common} viewBox="0 0 24 24"><path d="M5 5h3v3H5zM11 5h3v3h-3zM17 5h3v3h-3zM5 11h3v3H5zM11 11h3v3h-3zM17 11h3v3h-3zM5 17h3v3H5zM11 17h3v3h-3zM17 17h3v3h-3z"/></svg>`,
    check: `<svg ${common} viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>`,
  };

  return paths[name] || "";
}
