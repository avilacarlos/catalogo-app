const SUPABASE_URL = 'https://udwzfzmuhakscoehfzqq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkd3pmem11aGFrc2NvZWhmenFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0Nzg1MTUsImV4cCI6MjEwNTA1NDUxNX0.PhaCm3rRHr02DUC3NrOdh2jNvYrgrh0EwONLMIXCnYk';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const statusEl = document.getElementById('events-status');
const listEl = document.getElementById('events-list');
const formEl = document.getElementById('event-form');
const categoryEl = document.getElementById('categoria_id');
const formMessageEl = document.getElementById('event-form-message');

document.addEventListener('DOMContentLoaded', () => {
  formEl?.addEventListener('submit', createEvent);
  loadEvents();
});

async function loadEvents() {
  try {
    const [eventsResult, clientsResult, categoriesResult, selectionsResult, favoritesResult, versesResult] = await Promise.all([
      supabaseClient.from('eventos').select('id, cliente_id, categoria_id, festejado, slug, estado').order('created_at', { ascending: false }),
      supabaseClient.from('clientes').select('id, nombre'),
      supabaseClient.from('categorias_verso').select('id, nombre'),
      supabaseClient.from('selecciones').select('evento_id, verso_id, estado'),
      supabaseClient.from('favoritos').select('evento_id, verso_id'),
      supabaseClient.from('versos').select('id, codigo, contenido')
    ]);

    const error = [eventsResult, clientsResult, categoriesResult, selectionsResult, favoritesResult, versesResult]
      .map(result => result.error)
      .find(Boolean);

    if (error) throw error;

    const maps = {
      clients: new Map((clientsResult.data || []).map(item => [item.id, item.nombre])),
      categories: new Map((categoriesResult.data || []).map(item => [item.id, item.nombre])),
      verses: new Map((versesResult.data || []).map(item => [item.id, item])),
      selections: new Map((selectionsResult.data || []).map(item => [item.evento_id, item])),
      favorites: new Map()
    };

    (favoritesResult.data || []).forEach(item => {
      const favorites = maps.favorites.get(item.evento_id) || [];
      favorites.push(item.verso_id);
      maps.favorites.set(item.evento_id, favorites);
    });

    renderEvents(eventsResult.data || [], maps);
    renderCategories(categoriesResult.data || []);
  } catch (error) {
    console.error(error);
    statusEl.textContent = 'No pudimos cargar los eventos.';
    listEl.innerHTML = '<p class="events-empty">Verifica la conexión con Supabase.</p>';
  }
}

async function createEvent(event) {
  event.preventDefault();
  const formData = new FormData(formEl);
  const clientName = String(formData.get('cliente_nombre') || '').trim();
  const festejado = String(formData.get('festejado') || '').trim();
  const categoryId = Number(formData.get('categoria_id'));
  const submitButton = formEl.querySelector('button[type="submit"]');

  if (!clientName || !festejado || !categoryId) return;

  submitButton.disabled = true;
  formMessageEl.textContent = 'Creando evento...';

  try {
    const { data: client, error: clientError } = await supabaseClient
      .from('clientes')
      .insert({ nombre: clientName })
      .select('id')
      .single();

    if (clientError) throw clientError;

    const slug = `${slugify(festejado)}-${randomSuffix()}`;
    const { error: eventError } = await supabaseClient
      .from('eventos')
      .insert({
        cliente_id: client.id,
        categoria_id: categoryId,
        festejado,
        slug,
        estado: 'activo'
      });

    if (eventError) throw eventError;

    formEl.reset();
    formMessageEl.textContent = `Evento creado: ${slug}`;
    await loadEvents();
  } catch (error) {
    console.error(error);
    formMessageEl.textContent = 'No se pudo crear el evento.';
  } finally {
    submitButton.disabled = false;
  }
}

function renderCategories(categories) {
  if (!categoryEl || categoryEl.options.length) return;
  const seen = new Set();
  const uniqueCategories = categories.filter(category => {
    if (category.activo === false) return false;
    const key = String(category.slug || category.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  categoryEl.innerHTML = '<option value="">Selecciona una categoría</option>' + uniqueCategories
    .map(category => `<option value="${category.id}">${escapeHTML(category.nombre)}</option>`)
    .join('');
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'evento';
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

function renderEvents(events, maps) {
  statusEl.textContent = `${events.length} evento${events.length === 1 ? '' : 's'}`;

  if (!events.length) {
    listEl.innerHTML = '<p class="events-empty">Todavía no hay eventos registrados.</p>';
    return;
  }

  listEl.innerHTML = events.map(event => {
    const selection = maps.selections.get(event.id);
    const selectedVerse = selection ? maps.verses.get(selection.verso_id) : null;
    const favorites = maps.favorites.get(event.id) || [];
    const catalogUrl = `${window.location.origin}/v2/?slug=${encodeURIComponent(event.slug)}`;

    return `
      <article class="event-card">
        <div class="event-card-top">
          <div>
            <span class="event-status event-status-${event.estado}">${escapeHTML(event.estado)}</span>
            <h2>${escapeHTML(event.festejado)}</h2>
            <p>${escapeHTML(maps.clients.get(event.cliente_id) || 'Sin cliente')} · ${escapeHTML(maps.categories.get(event.categoria_id) || 'Sin categoría')}</p>
          </div>
        </div>

        <div class="event-data">
          <div><small>Favoritos</small><strong>${favorites.length}</strong></div>
          <div><small>Verso elegido</small><strong>${escapeHTML(selectedVerse?.codigo || 'Pendiente')}</strong></div>
        </div>

        <p class="event-selection">${selectedVerse ? escapeHTML(selectedVerse.contenido) : 'El cliente todavía no ha elegido un verso.'}</p>

        <div class="event-actions">
          <a href="${catalogUrl}" target="_blank" rel="noopener">Abrir catálogo</a>
          <button type="button" data-copy-url="${catalogUrl}">Copiar URL</button>
        </div>
      </article>
    `;
  }).join('');

  listEl.querySelectorAll('[data-copy-url]').forEach(button => {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.dataset.copyUrl);
      button.textContent = 'URL copiada';
      setTimeout(() => { button.textContent = 'Copiar URL'; }, 1800);
    });
  });
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
