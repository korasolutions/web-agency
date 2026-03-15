// ========================================
// CHATBOT VOICEFLOW - KORA SOLUTIONS
// ========================================

(function(d, t) {
    'use strict';
    
    // Crear elemento script
    var v = d.createElement(t), 
        s = d.getElementsByTagName(t)[0];
    
    // Configurar función cuando el script cargue
    v.onload = function() {
        console.log('🤖 Chatbot de KORA cargado correctamente');
        
        // Inicializar el chatbot de Voiceflow
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
            console.log('✅ Chatbot de KORA inicializado y listo');
        }).catch((error) => {
            console.error('❌ Error al inicializar el chatbot:', error);
        });
    };
    
    // Manejar errores de carga
    v.onerror = function() {
        console.error('❌ Error al cargar el script del chatbot');
    };
    
    // Configurar src y tipo del script
    v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
    v.type = "text/javascript";
    
    // Insertar el script en el documento
    s.parentNode.insertBefore(v, s);
    
})(document, 'script');