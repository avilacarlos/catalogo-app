// src/auth-guard.js

// Configuración: 2 horas en milisegundos
// (2 horas * 60 minutos * 60 segundos * 1000 milisegundos)
const TIEMPO_MAXIMO = 2 * 60 * 60 * 1000; 

function verificarSeguridad() {
    const loginTime = sessionStorage.getItem('login_timestamp');
    const isSessionActive = sessionStorage.getItem('sesion_activa');

    const ahora = Date.now();

    // 1. Si no hay sesión, o
    // 2. Si no hay marca de tiempo, o
    // 3. Si han pasado más de 2 horas
    if (!isSessionActive || !loginTime || (ahora - loginTime > TIEMPO_MAXIMO)) {
        cerrarSesion();
    }
}

function cerrarSesion() {
    // Borramos todo rastro
    sessionStorage.clear();
    
    // Si NO estamos ya en el login, mandamos al usuario para allá
    if (!window.location.pathname.includes('index.html') && 
        window.location.pathname !== '/') {
        alert("Tu sesión ha expirado por seguridad.");
        window.location.href = '/index.html';
    }
}

// Ejecutar verificación inmediatamente al cargar el script
verificarSeguridad();

// Y seguir verificando cada minuto (por si deja la pestaña abierta sin recargar)
setInterval(verificarSeguridad, 60000);