/**
 * verificar.js — Revisión previa antes de subir a GitHub.
 *
 * Comprueba que el CSV, datos.json, las fotos y los QRs estén coherentes,
 * y que el repositorio no vaya a chocar con GitHub al hacer push.
 *
 * Uso:  node verificar.js       (o:  npm run verificar)
 *
 * Sale con código 1 si hay ERRORES, 0 si todo está bien (los AVISOS no
 * bloquean: son cosas para revisar, no fallas).
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { execSync } = require('child_process');

const ARCHIVO_CSV = 'datos_personal_dengue.csv';
const ARCHIVO_JSON = 'datos.json';
const DIRECTORIO_QR = 'qrs';
const DIRECTORIO_FOTOS = path.join('img', 'fotos_perfil_personal');
const COLUMNAS = ['ID', 'GRUPO', 'NOMBRE Y APELLIDOS', 'DNI', 'PROFESIÓN', 'CARGO', 'VIGENCIA'];

const errores = [];
const avisos = [];
const err = (m) => errores.push(m);
const avi = (m) => avisos.push(m);

const titulo = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);
const ok = (m) => console.log(`  \x1b[32m✔\x1b[0m ${m}`);
const mal = (m) => console.log(`  \x1b[31m✘\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);

// Misma limpieza de columnas que usa generar.js
const sanitizeKeys = (row) => {
    const cleanRow = {};
    for (const key in row) {
        cleanRow[key.trim().replace(/^\uFEFF/, '')] = row[key].trim();
    }
    return cleanRow;
};

const git = (cmd) => {
    try {
        return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        return null;
    }
};

const leerCsv = () => new Promise((resolve, reject) => {
    const filas = [];
    fs.createReadStream(ARCHIVO_CSV)
        .pipe(csv({ separator: ';' }))
        .on('data', (d) => filas.push(sanitizeKeys(d)))
        .on('end', () => resolve(filas))
        .on('error', reject);
});

async function main() {
    console.log('\n\x1b[1m═══ Verificación del sistema de fotochecks QR ═══\x1b[0m');

    // ---------------------------------------------------------------
    titulo('1. Marcas de conflicto de Git');
    // ---------------------------------------------------------------
    const revisables = [ARCHIVO_CSV, ARCHIVO_JSON, 'perfil.html', 'estilos.css', 'generar.js', 'README.md'];
    let conflictos = 0;
    for (const f of revisables) {
        if (!fs.existsSync(f)) continue;
        const texto = fs.readFileSync(f, 'utf8');
        const linea = texto.split(/\r?\n/).findIndex((l) => /^(<{7}|={7}|>{7})(\s|$)/.test(l));
        if (linea !== -1) {
            mal(`${f}: marca de conflicto sin resolver en la línea ${linea + 1}`);
            err(`Conflicto sin resolver en ${f}`);
            conflictos++;
        }
    }
    if (conflictos === 0) ok('Ningún archivo tiene marcas <<<<<<< / >>>>>>> sin resolver');

    // ---------------------------------------------------------------
    titulo('2. Lectura del CSV');
    // ---------------------------------------------------------------
    let filas;
    try {
        filas = await leerCsv();
        ok(`${ARCHIVO_CSV} se lee correctamente (${filas.length} registros)`);
    } catch (e) {
        mal(`No se pudo leer ${ARCHIVO_CSV}: ${e.message}`);
        err('CSV ilegible');
        return terminar();
    }
    const faltantes = COLUMNAS.filter((c) => !(c in (filas[0] || {})));
    if (faltantes.length) {
        mal(`Faltan columnas en el CSV: ${faltantes.join(', ')}`);
        err('Columnas faltantes en el CSV');
    } else {
        ok('Todas las columnas esperadas están presentes');
    }

    // ---------------------------------------------------------------
    titulo('3. IDs y DNIs');
    // ---------------------------------------------------------------
    const vistosId = new Map();
    const vistosDni = new Map();
    let problemasId = 0;
    for (const p of filas) {
        const nombre = p['NOMBRE Y APELLIDOS'] || '(sin nombre)';
        if (!p.ID) {
            mal(`${nombre}: no tiene ID (su QR no se generará)`);
            err(`Registro sin ID: ${nombre}`);
            problemasId++;
        } else if (vistosId.has(p.ID)) {
            mal(`ID ${p.ID} duplicado: "${vistosId.get(p.ID)}" y "${nombre}"`);
            err(`ID duplicado: ${p.ID}`);
            problemasId++;
        } else {
            vistosId.set(p.ID, nombre);
        }

        if (!p.DNI) {
            warn(`${nombre} (ID ${p.ID}): sin DNI, nunca se le podrá vincular una foto`);
            avi(`Sin DNI: ${nombre}`);
        } else if (!/^\d+$/.test(p.DNI)) {
            // Este es el error de Excel que rompe la vinculación de fotos
            mal(`ID ${p.ID} ${nombre}: el DNI "${p.DNI}" tiene caracteres que no son números`);
            err(`DNI con caracteres inválidos: ${nombre} -> "${p.DNI}"`);
            problemasId++;
        } else {
            if (p.DNI.length !== 8) {
                warn(`ID ${p.ID} ${nombre}: DNI "${p.DNI}" tiene ${p.DNI.length} dígitos (lo normal son 8, revisa si Excel comió un cero)`);
                avi(`DNI de largo inusual: ${nombre}`);
            }
            if (vistosDni.has(p.DNI)) {
                warn(`DNI ${p.DNI} repetido: "${vistosDni.get(p.DNI)}" y "${nombre}" — compartirán la misma foto`);
                avi(`DNI duplicado: ${p.DNI}`);
            } else {
                vistosDni.set(p.DNI, nombre);
            }
        }
    }
    if (problemasId === 0) ok(`${vistosId.size} IDs únicos y todos los DNIs son numéricos`);

    // ---------------------------------------------------------------
    titulo('4. ¿datos.json está al día? (¿corriste generar.js?)');
    // ---------------------------------------------------------------
    const archivosFotos = fs.existsSync(DIRECTORIO_FOTOS) ? fs.readdirSync(DIRECTORIO_FOTOS) : [];
    const esperado = filas.map((p) => {
        const copia = { ...p };
        if (p.DNI) {
            const foto = archivosFotos.find((f) => f.includes(p.DNI));
            if (foto) copia.FOTO = `${DIRECTORIO_FOTOS.replace(/\\/g, '/')}/${encodeURIComponent(foto)}`;
        }
        return copia;
    });

    let datos = null;
    if (!fs.existsSync(ARCHIVO_JSON)) {
        mal(`No existe ${ARCHIVO_JSON}. Ejecuta: node generar.js`);
        err('Falta datos.json');
    } else {
        try {
            datos = JSON.parse(fs.readFileSync(ARCHIVO_JSON, 'utf8'));
            ok(`${ARCHIVO_JSON} es un JSON válido (${datos.length} registros)`);
        } catch (e) {
            mal(`${ARCHIVO_JSON} está corrupto: ${e.message}`);
            err('datos.json no parsea');
        }
    }

    if (datos) {
        if (JSON.stringify(esperado) === JSON.stringify(datos)) {
            ok('datos.json coincide exactamente con el CSV y las fotos de la carpeta');
        } else {
            mal('datos.json NO coincide con el CSV. La web mostraría datos viejos.');
            mal('   Solución:  node generar.js');
            err('datos.json desactualizado — falta correr generar.js');
            if (esperado.length !== datos.length) {
                console.log(`      (CSV tiene ${esperado.length} registros, datos.json tiene ${datos.length})`);
            } else {
                const distintos = esperado
                    .map((e, i) => (JSON.stringify(e) !== JSON.stringify(datos[i]) ? e : null))
                    .filter(Boolean)
                    .slice(0, 5);
                for (const d of distintos) {
                    console.log(`      difiere: ID ${d.ID} ${d['NOMBRE Y APELLIDOS']}`);
                }
            }
        }
    }

    // ---------------------------------------------------------------
    titulo('5. Fotos de perfil');
    // ---------------------------------------------------------------
    const usadas = new Set();
    let rotas = 0;
    for (const p of esperado) {
        if (!p.FOTO) continue;
        const ruta = decodeURIComponent(p.FOTO);
        if (fs.existsSync(ruta)) {
            usadas.add(path.basename(ruta));
        } else {
            mal(`ID ${p.ID} ${p['NOMBRE Y APELLIDOS']}: apunta a "${ruta}" pero el archivo no existe`);
            err(`Foto inexistente para ${p['NOMBRE Y APELLIDOS']}`);
            rotas++;
        }
    }
    const conFoto = esperado.filter((p) => p.FOTO).length;
    if (rotas === 0) ok(`${conFoto} de ${esperado.length} personas tienen foto y todos los archivos existen`);

    const huerfanas = archivosFotos.filter((f) => !usadas.has(f));
    if (huerfanas.length) {
        warn(`${huerfanas.length} foto(s) en la carpeta que no coinciden con ningún DNI del CSV:`);
        huerfanas.forEach((f) => console.log(`      ${f}`));
        avi(`${huerfanas.length} foto(s) sin vincular`);
    } else if (archivosFotos.length) {
        ok('Ninguna foto quedó huérfana en la carpeta');
    }

    const sinFoto = esperado.filter((p) => !p.FOTO);
    if (sinFoto.length) {
        warn(`${sinFoto.length} persona(s) sin foto — su fotocheck mostrará el avatar de iniciales`);
        avi(`${sinFoto.length} persona(s) sin foto`);
    }

    // ---------------------------------------------------------------
    titulo('6. Códigos QR');
    // ---------------------------------------------------------------
    const qrsEnDisco = fs.existsSync(DIRECTORIO_QR) ? fs.readdirSync(DIRECTORIO_QR).filter((f) => f.endsWith('.png')) : [];
    const faltanQr = [...vistosId.keys()].filter((id) => !qrsEnDisco.includes(`${id}.png`));
    if (faltanQr.length) {
        mal(`Faltan QRs para los ID: ${faltanQr.join(', ')}. Ejecuta: node generar.js`);
        err(`Faltan ${faltanQr.length} QR(s)`);
    } else {
        ok(`Los ${vistosId.size} IDs tienen su QR en la carpeta ${DIRECTORIO_QR}/`);
    }
    const qrHuerfanos = qrsEnDisco.filter((f) => !vistosId.has(f.replace('.png', '')));
    if (qrHuerfanos.length) {
        warn(`${qrHuerfanos.length} QR(s) sin persona en el CSV (personal dado de baja): ${qrHuerfanos.join(', ')}`);
        avi(`${qrHuerfanos.length} QR(s) huérfano(s)`);
    }

    // ---------------------------------------------------------------
    titulo('7. Coherencia de brigadas y vigencias');
    // ---------------------------------------------------------------
    const porGrupo = {};
    for (const p of filas) {
        (porGrupo[p.GRUPO] ??= []).push(p);
    }
    for (const [grupo, gente] of Object.entries(porGrupo).sort()) {
        const jefes = gente.filter((p) => (p.CARGO || '').toUpperCase().includes('JEFE'));
        if (jefes.length === 0) {
            warn(`${grupo}: ${gente.length} personas, ningún JEFE DE BRIGADA`);
            avi(`${grupo} sin jefe`);
        } else if (jefes.length > 1) {
            warn(`${grupo}: ${jefes.length} jefes de brigada (${jefes.map((j) => j['NOMBRE Y APELLIDOS']).join(', ')})`);
            avi(`${grupo} con ${jefes.length} jefes`);
        }
    }
    if (!avisos.some((a) => a.includes('sin jefe') || a.includes('jefes'))) {
        ok(`Los ${Object.keys(porGrupo).length} grupos tienen exactamente un jefe de brigada`);
    }

    const diasMes = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const fechasMalas = new Set();
    for (const p of filas) {
        const m = (p.VIGENCIA || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (m) {
            const [, d, mes] = m.map(Number);
            if (mes < 1 || mes > 12 || d < 1 || d > diasMes[mes - 1]) fechasMalas.add(p.VIGENCIA);
        }
    }
    if (fechasMalas.size) {
        warn(`Vigencia con fecha que no existe en el calendario: ${[...fechasMalas].join(' | ')}`);
        avi('Fecha de vigencia inválida');
    } else {
        ok('Las fechas de vigencia son válidas');
    }

    // ---------------------------------------------------------------
    titulo('8. Estado de Git (¿habrá conflicto al subir?)');
    // ---------------------------------------------------------------
    if (git('rev-parse --is-inside-work-tree') !== 'true') {
        warn('Esta carpeta no es un repositorio Git; se omite la revisión.');
    } else if (fs.existsSync(path.join('.git', 'rebase-merge')) || fs.existsSync(path.join('.git', 'MERGE_HEAD'))) {
        mal('Hay un pull/rebase a medio terminar. Resuélvelo antes de seguir:');
        mal('   git status     (para ver qué falta)');
        mal('   git rebase --abort     (para cancelar y volver atrás)');
        err('Rebase/merge sin terminar');
    } else {
        const rama = git('rev-parse --abbrev-ref HEAD');
        const sucio = git('status --porcelain');
        console.log(`  Rama actual: ${rama}`);

        process.stdout.write('  Consultando GitHub... ');
        const fetched = git('fetch origin --quiet') !== null;
        console.log(fetched ? 'listo' : 'sin conexión');

        if (!fetched) {
            warn('No se pudo consultar GitHub (¿sin internet?). No puedo anticipar conflictos.');
            avi('Sin conexión a GitHub');
        } else {
            const cuenta = git(`rev-list --left-right --count origin/${rama}...${rama}`);
            const [detras, adelante] = (cuenta || '0\t0').split(/\s+/).map(Number);

            if (detras === 0 && adelante === 0 && !sucio) {
                ok('Todo sincronizado con GitHub. No hay nada que subir.');
            } else if (detras === 0) {
                ok(`Sin cambios nuevos en GitHub — el push será directo, sin riesgo de conflicto.`);
                if (adelante) console.log(`      Tienes ${adelante} commit(s) listos para subir.`);
                if (sucio) console.log(`      Además hay cambios sin confirmar (falta git add + git commit).`);
            } else {
                warn(`GitHub tiene ${detras} commit(s) que tú no tienes. Debes traerlos ANTES de subir:`);
                console.log('        git pull --rebase origin main');
                avi('Hay que hacer pull antes del push');

                // ¿Los cambios remotos tocan los mismos archivos que los míos?
                const mios = new Set([
                    ...(adelante ? git(`diff --name-only origin/${rama}...${rama}`) || '' : '').split('\n'),
                    ...(sucio || '').split('\n').map((l) => l.slice(3)),
                ].filter(Boolean));
                const suyos = (git(`diff --name-only ${rama}...origin/${rama}`) || '').split('\n').filter(Boolean);
                const chocan = suyos.filter((f) => mios.has(f));
                if (chocan.length) {
                    warn(`Riesgo real de conflicto: estos archivos cambiaron en los dos lados:`);
                    chocan.forEach((f) => console.log(`        ${f}`));
                    console.log('        Si sale CONFLICT, revisa la sección del README "Si aparece un conflicto".');
                } else {
                    ok('Los cambios remotos tocan archivos distintos: el pull debería entrar limpio.');
                }
            }
        }
    }

    terminar();
}

function terminar() {
    console.log('\n' + '─'.repeat(60));
    if (errores.length === 0 && avisos.length === 0) {
        console.log('\x1b[32m\x1b[1m✔ TODO CORRECTO — puedes subir los cambios con confianza.\x1b[0m\n');
        process.exit(0);
    }
    if (errores.length) {
        console.log(`\x1b[31m\x1b[1m✘ ${errores.length} ERROR(ES) — corrígelos antes de subir:\x1b[0m`);
        errores.forEach((e) => console.log(`   • ${e}`));
    }
    if (avisos.length) {
        console.log(`\x1b[33m${avisos.length} aviso(s) para revisar (no impiden subir):\x1b[0m`);
        avisos.forEach((a) => console.log(`   • ${a}`));
    }
    console.log('');
    process.exit(errores.length ? 1 : 0);
}

main().catch((e) => {
    console.error('\n\x1b[31mError inesperado durante la verificación:\x1b[0m', e);
    process.exit(1);
});
