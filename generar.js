const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const QRCode = require('qrcode');

// Cambiamos al archivo real de tu personal
const ARCHIVO_CSV = 'datos_personal_dengue.csv';
const ARCHIVO_JSON = 'datos.json';
const DIRECTORIO_QR = 'qrs';

// URL de GitHub Pages
const URL_BASE = 'https://redsaludfernando-dev.github.io/Identificacion_qr_personal_dengue'; 

if (!fs.existsSync(DIRECTORIO_QR)) {
    fs.mkdirSync(DIRECTORIO_QR);
}

const resultados = [];

// Función para limpiar posibles espacios en los nombres de las columnas (BOM u otros caracteres invisibles)
const sanitizeKeys = (row) => {
    const cleanRow = {};
    for (const key in row) {
        // Remueve espacios al inicio/final y caracteres invisibles raros
        const cleanKey = key.trim().replace(/^\uFEFF/, '');
        cleanRow[cleanKey] = row[key].trim();
    }
    return cleanRow;
};

fs.createReadStream(ARCHIVO_CSV)
  .pipe(csv({ separator: ';' }))
  .on('data', (data) => resultados.push(sanitizeKeys(data)))
  .on('end', async () => {
    // Buscar fotos para cada persona
    const DIRECTORIO_FOTOS = path.join('img', 'fotos_perfil_personal');
    let archivosFotos = [];
    if (fs.existsSync(DIRECTORIO_FOTOS)) {
        archivosFotos = fs.readdirSync(DIRECTORIO_FOTOS);
    }

    resultados.forEach(persona => {
        if (persona.DNI) {
            const fotoEncontrada = archivosFotos.find(f => f.includes(persona.DNI));
            if (fotoEncontrada) {
                // Guarda la ruta relativa para la web
                persona.FOTO = `img/fotos_perfil_personal/${encodeURIComponent(fotoEncontrada)}`;
            }
        }
    });

    // 1. Guardar como JSON para que la web pueda leerlo rápido
    fs.writeFileSync(ARCHIVO_JSON, JSON.stringify(resultados, null, 2));
    console.log(`✅ Archivo datos.json actualizado con éxito. (${resultados.length} registros encontrados)`);

    // 2. Generar código QR en imagen para cada persona usando su DNI
    for (const persona of resultados) {
        if (!persona.DNI) {
            console.warn(`⚠️ Fila saltada: No se encontró DNI para`, persona['NOMBRE Y APELLIDOS']);
            continue;
        }
        
        // La URL a la que redirige el QR al escanearse con la cámara
        const urlPerfil = `${URL_BASE}/perfil.html?id=${persona.DNI}`;
        const rutaImagenQR = path.join(DIRECTORIO_QR, `${persona.DNI}.png`);
        
        try {
            await QRCode.toFile(rutaImagenQR, urlPerfil, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            console.log(`✅ QR generado para ${persona['NOMBRE Y APELLIDOS']} (DNI: ${persona.DNI})`);
        } catch (error) {
            console.error(`❌ Error generando QR para DNI ${persona.DNI}:`, error);
        }
    }
    console.log('🎉 Proceso de generación completado.');
  });