import './style.css';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN SUPABASE ---
const SUPABASE_URL = 'https://lseheeajwwhjsqjtffal.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZWhlZWFqd3doanNxanRmZmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Nzc2NTQsImV4cCI6MjA2NjE1MzY1NH0.Q6S4salQ1ihghhDAJtb-jb4amvKNiJGX1843uJJontw'; // <--- ¡VERIFICA TU KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Configuración de Prefijos y Títulos
const configCategorias = {
    'boda':    { titulo: 'BODA', prefijo: 'BO' },
    'xv':      { titulo: 'QUINCE AÑOS',   prefijo: 'XV' },
    'bautizo': { titulo: 'BAUTIZO',    prefijo: 'BA' },
    'varios':  { titulo: 'ESQUELAS', prefijo: 'ES' }
};

document.addEventListener('DOMContentLoaded', async () => {
    
    // Verificar sesión
    if (!sessionStorage.getItem('sesion_activa')) {
        window.location.href = '/index.html';
        return;
    }

    // Obtener parámetros URL
    const params = new URLSearchParams(window.location.search);
    const catKey = params.get('cat');
    const container = document.getElementById('grid-versos');
    const titleEl = document.getElementById('cat-title');

    // Configurar Título
    const config = configCategorias[catKey] || { titulo: 'CATÁLOGO', prefijo: 'ID' };
    if(titleEl) titleEl.textContent = config.titulo;

    if(!container) return;

    // Cargar datos
    container.innerHTML = '<p style="text-align:center; margin-top:20px;">Cargando...</p>';

    try {
        const { data, error } = await supabase
            .from('versos')
            .select('*')
            .eq('categoria', catKey)
            .order('id', { ascending: true }); // Mantiene el orden original de creación

        if (error) throw error;
        container.innerHTML = '';

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No hay versos disponibles.</p>';
            return;
        }

        // --- RENDERIZADO DE TARJETAS ---
        // Usamos 'index' para generar la numeración 01, 02, 03... por categoría
        data.forEach((verso, index) => {
            
            // Lógica de numeración: (0 + 1) -> "1" -> "01"
            const numeroConsecutivo = (index + 1).toString().padStart(2, '0');
            
            // Construimos el ID: BO01, XV05, etc. (Sin #)
            const fullID = `${config.prefijo}${numeroConsecutivo}`; 
            
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="verse-text">"${verso.contenido}"</div>
                <div class="card-footer">
                    <!-- Aquí se muestra el ID sin el # -->
                    <div class="id-badge" id="badge-${verso.id}">
                        ${fullID}
                    </div>
                </div>
            `;

            container.appendChild(card);

            // --- LÓGICA DE LONG PRESS ---
            const badge = card.querySelector(`#badge-${verso.id}`);
            setupLongPress(badge, verso.contenido, fullID);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="text-align:center; color:red;">Error de conexión.</p>';
    }
});

/**
 * Función que maneja el evento de "Mantener presionado"
 */
function setupLongPress(element, textToCopy, originalText) {
    let pressTimer;
    const LONG_PRESS_DURATION = 600; 

    const performCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Feedback visual
            element.classList.add('copied');
            element.textContent = '¡COPIADO!';
            
            if (navigator.vibrate) navigator.vibrate(50);

            // Restaurar texto (Sin agregar # extra)
            setTimeout(() => {
                element.classList.remove('copied');
                element.textContent = originalText; // Restauramos "BO01" limpio
            }, 2000);
        });
    };

    // --- EVENTOS MOUSE (PC) ---
    element.addEventListener('mousedown', () => {
        pressTimer = setTimeout(performCopy, LONG_PRESS_DURATION);
    });
    element.addEventListener('mouseup', () => clearTimeout(pressTimer));
    element.addEventListener('mouseleave', () => clearTimeout(pressTimer));

    // --- EVENTOS TOUCH (CELULAR) ---
    element.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(performCopy, LONG_PRESS_DURATION);
    });
    element.addEventListener('touchend', () => clearTimeout(pressTimer));
    element.addEventListener('touchcancel', () => clearTimeout(pressTimer));
}