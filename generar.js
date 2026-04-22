const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const QRCode = require('qrcode');

const ARCHIVO_CSV = 'datos.csv';
const ARCHIVO_JSON = 'datos.json';
const DIRECTORIO_QR = 'qrs';

// IMPORTANTE: Cambia esta URL cuando subas a GitHub Pages
// Por ejemplo: 'https://tu-usuario.github.io/tu-repositorio'
const URL_BASE = 'https://redsaludfernando-dev.github.io/Identificacion_qr_personal_dengue'; 

if (!fs.existsSync(DIRECTORIO_QR)) {
    fs.mkdirSync(DIRECTORIO_QR);
}

const resultados = [];

fs.createReadStream(ARCHIVO_CSV)
  .pipe(csv())
  .on('data', (data) => resultados.push(data))
  .on('end', async () => {
    // 1. Guardar como JSON para que la web pueda leerlo rápido
    fs.writeFileSync(ARCHIVO_JSON, JSON.stringify(resultados, null, 2));
    console.log('✅ Archivo datos.json actualizado con éxito.');

    // 2. Generar código QR en imagen para cada persona
    for (const persona of resultados) {
        if (!persona.id) continue;
        
        // La URL a la que redirige el QR al escanearse con la cámara
        const urlPerfil = `${URL_BASE}/perfil.html?id=${persona.id}`;
        const rutaImagenQR = path.join(DIRECTORIO_QR, `${persona.id}.png`);
        
        try {
            await QRCode.toFile(rutaImagenQR, urlPerfil, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            console.log(`✅ QR generado para ${persona.nombres} (ID: ${persona.id}) -> ${rutaImagenQR}`);
        } catch (error) {
            console.error(`❌ Error generando QR para ID ${persona.id}:`, error);
        }
    }
    console.log('🎉 Proceso completado.');
  });