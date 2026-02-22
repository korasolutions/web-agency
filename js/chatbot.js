// ========================================
// CHATBOT VOICEFLOW - CONFIGURACIÓN
// ========================================

(function(d, t) {
    'use strict';
    
    // Crear elemento script
    var v = d.createElement(t), 
        s = d.getElementsByTagName(t)[0];
    
    v.onload = function() {
        console.log('✅ Chatbot de KORA cargado correctamente');
        
        // Configuración del chatbot
        window.voiceflow.chat.load({
            verify: { 
                projectID: '699b47fad96c5bc64fd64282' 
            },
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production',
            voice: {
                url: "https://runtime-api.voiceflow.com"
            }
        }).then(() => {
            console.log('✅ Chatbot de KORA inicializado');
            
            // SOLUCIÓN: Forzar posición fija y eliminar espacio en el DOM
            setTimeout(() => {
                // Buscar todos los elementos del chatbot
                const chatElements = document.querySelectorAll('.vfrc-widget-container, .vfrc-launcher, .vfrc-chat, .vfrc-widget');
                
                chatElements.forEach(element => {
                    if (element) {
                        // Hacer que el elemento sea flotante y no ocupe espacio en el DOM
                        element.style.position = 'fixed';
                        element.style.bottom = '20px';
                        element.style.right = '20px';
                        element.style.left = 'auto';
                        element.style.top = 'auto';
                        element.style.zIndex = '999999';
                        element.style.pointerEvents = 'auto'; // Mantener interactivo
                        
                        // Forzar que no afecte el layout
                        element.style.display = 'block';
                        element.style.contain = 'layout paint';
                    }
                });
                
                // SOLUCIÓN ESPECÍFICA: Buscar el contenedor raíz del widget
                const widgetRoot = document.getElementById('voiceflow-widget') || 
                                   document.querySelector('[data-testid="widget-container"]') ||
                                   document.querySelector('.vfrc-widget-container');
                
                if (widgetRoot) {
                    widgetRoot.style.position = 'fixed';
                    widgetRoot.style.bottom = '20px';
                    widgetRoot.style.right = '20px';
                }
                
                // Ocultar cualquier elemento fantasma que pueda estar causando el hueco
                const possibleGhosts = document.querySelectorAll('div[style*="height"], div[style*="margin"]');
                possibleGhosts.forEach(ghost => {
                    if (ghost.textContent === '' && ghost.children.length === 0 && 
                        ghost.clientHeight > 0 && ghost.clientHeight < 100) {
                        // Posible elemento fantasma del chatbot
                        ghost.style.display = 'none';
                    }
                });
                
            }, 1500); // Aumentamos el timeout para asegurar que el widget esté completamente cargado
            
        }).catch(error => {
            console.error('❌ Error al cargar el chatbot:', error);
        });
    };
    
    v.onerror = function() {
        console.error('❌ Error al cargar el script del chatbot');
    };
    
    v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; 
    v.type = "text/javascript"; 
    s.parentNode.insertBefore(v, s);
    
})(document, 'script');

// FUNCIÓN DE EMERGENCIA: Forzar posición fija después de la carga completa
window.addEventListener('load', function() {
    setTimeout(function() {
        // Búsqueda agresiva de elementos del chatbot
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const styles = window.getComputedStyle(el);
            if (styles.position === 'absolute' || styles.position === 'relative') {
                // Si el elemento tiene clases típicas de Voiceflow
                if (el.className && (
                    el.className.includes('vfrc') || 
                    el.className.includes('voiceflow') || 
                    el.className.includes('widget')
                )) {
                    el.style.position = 'fixed !important';
                    el.style.bottom = '20px !important';
                    el.style.right = '20px !important';
                    el.style.zIndex = '999999 !important';
                }
            }
        });
        
        // Eliminar cualquier espacio extra al final del body
        document.body.style.marginBottom = '0';
        document.body.style.paddingBottom = '0';
        
    }, 2000);
});