import './style.css';
import { createClient } from '@supabase/supabase-js';
import Parallax from 'parallax-js';

// --- CONFIGURACIÓN DE SUPABASE ---
// Reemplaza esto con tus datos REALES (los puedes ver en tu dashboard de Supabase)
const SUPABASE_URL = 'https://lseheeajwwhjsqjtffal.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZWhlZWFqd3doanNxanRmZmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Nzc2NTQsImV4cCI6MjA2NjE1MzY1NH0.Q6S4salQ1ihghhDAJtb-jb4amvKNiJGX1843uJJontw'; // <--- PEGA TU KEY AQUÍ

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Iniciar Parallax
    const scene = document.getElementById('logo-scene');
    if(scene) new Parallax(scene);

    // 2. Lógica de Login
    const form = document.getElementById('login-form');
    const input = document.getElementById('password');
    const btn = document.getElementById('btn-login');
    const errorMsg = document.getElementById('error-msg');

    // Verificar si ya está logueado
    if (sessionStorage.getItem('sesion_activa') === 'true') {
        window.location.href = '/menu.html';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const clave = input.value.trim();
        
        if (!clave) return;

        // UI de carga
        btn.textContent = 'Verificando...';
        btn.disabled = true;
        errorMsg.style.display = 'none';

        try {
            // Consultamos la tabla 'passwords'
            const { data, error } = await supabase
                .from('passwords')
                .select('*')
                .eq('nota', clave) // Asumo que la columna se llama 'code'
                .single();

            if (error || !data) {
                throw new Error('Clave inválida');
            }

            // Éxito
            sessionStorage.setItem('sesion_activa', 'true');
            sessionStorage.setItem('login_timestamp', Date.now()); 
            window.location.href = '/menu.html';

        } catch (err) {
            console.error(err);
            errorMsg.style.display = 'block';
            input.value = '';
            btn.textContent = 'ENTRAR';
            btn.disabled = false;
        }
    });
});
