# Sistema de Identificación QR - Personal Dengue 🦟

Este proyecto es una aplicación web y generador de códigos QR para el **Equipo de Vigilancia y Control Vectorial** de la **Unidad de Gestión Territorial de Salud - UNGET Rioja**.

Permite identificar al personal de campo mediante el escaneo de un código QR único que muestra un fotocheck digital con sus datos oficiales.

## 🌟 Características

*   **Generador Automático:** Crea un código QR único por cada persona listada en el archivo Excel/CSV basado en su identificador (`ID`).
*   **Fotocheck Digital:** Muestra un diseño profesional con el logo institucional, marca de agua de la campaña, y foto de perfil dinámica.
*   **Actualización en Tiempo Real:** Al escanear el QR se lee la información más reciente publicada en la web. Si cambia el cargo, la vigencia u otros datos, el QR físico impreso **no necesita ser reemplazado**, ya que este está atado a un `ID` único.
*   **Avatares Personalizados:** Soporta fotos de perfil individuales vinculadas mediante el número de **DNI** del personal. Si no hay foto, genera un avatar con sus iniciales.
*   **Alojamiento Gratuito:** Funciona al 100% sobre **GitHub Pages**.

---

## 📂 Estructura del Proyecto

*   `datos_personal_dengue.csv`: **La base de datos.** Aquí está la lista de todo el personal (ID, Grupo, Nombres, DNI, Profesión, Cargo, Vigencia).
*   `generar.js`: El script (motor) que lee el CSV, crea los QRs únicos si no existen y actualiza los datos web.
*   `verificar.js`: Revisor automático. Comprueba que todo esté coherente **antes** de subir a GitHub (ver paso 4).
*   `ACTUALIZAR.bat`: **Haz doble clic aquí para publicar los cambios.** Hace todo el proceso solo (ver abajo).
*   `perfil.html`: La página web que se abre al escanear el QR (el diseño del fotocheck).
*   `estilos.css`: Los colores, logos y fondos de la página web.
*   `img/fotos_perfil_personal/`: Carpeta donde se guardan las fotos del personal. El nombre del archivo debe contener el **DNI** de la persona (ej. `Juan Perez-76124515.jpg`).
*   `img/`: Carpeta con los logos oficiales y la marca de agua del zancudo.
*   `qrs/`: Carpeta donde se guardan automáticamente las imágenes QR generadas (`1.png`, `2.png`, etc.), listas para imprimir.
*   `datos.json`: Archivo generado automáticamente. Es el "puente" que permite a la web leer los datos del CSV de forma rápida.

---

## 🚀 La forma fácil: `ACTUALIZAR.bat`

Después de editar el CSV o agregar fotos, **haz doble clic en `ACTUALIZAR.bat`**. Eso es todo.

El programa hace solo los 7 pasos: regenera `datos.json` y los QR que falten, verifica que no haya errores, te pide una descripción del cambio, trae lo que haya en GitHub, vuelve a verificar y publica.

**Se detiene sin subir nada si algo está mal.** Es su función principal:

| Situación | Qué hace |
|---|---|
| Hay un error en los datos (DNI raro, ID duplicado, foto rota) | Se detiene y te muestra qué corregir. No sube nada. |
| El CSV está abierto en Excel | Se detiene y te avisa que lo cierres. |
| GitHub tiene cambios nuevos | Los trae, vuelve a verificar y recién ahí publica. |
| Chocó solo `datos.json` | Lo resuelve solo: ese archivo se regenera desde el CSV. |
| Chocó el CSV (editado en dos lados) | **Se detiene.** Deja tu repositorio limpio y tus cambios intactos, y te dice que pidas ayuda. |
| No hay internet | Se detiene. Tus cambios quedan guardados localmente. |

> En ningún caso pierdes trabajo: si algo falla, tus cambios siguen guardados en tu PC y el repositorio queda en un estado limpio, sin nada a medio terminar.

Si prefieres escribir tú los comandos, o quieres entender qué hace por dentro, sigue leyendo.

---

## 🛠️ ¿Cómo agregar nuevo personal o actualizar datos? (paso a paso manual)

Si hay nuevo personal en la brigada o alguien cambió de cargo, sigue estos pasos:

### 1. Actualizar el archivo de datos
Abre el archivo `datos_personal_dengue.csv`.
*   **Para agregar:** Añade una nueva fila al final con los datos de la persona. **El `ID` es obligatorio y debe ser único**, ya que será el código permanente de su QR. El **DNI** también es necesario para vincular su foto de perfil.
*   **Para modificar datos:** Simplemente cambia el texto en la fila de la persona (ej. cambiar su CARGO o VIGENCIA). **No cambies el `ID`**, para que su QR físico siga funcionando.

### 2. Actualizar Foto de Perfil (Opcional)
Si deseas agregar o actualizar la foto de un trabajador, simplemente guarda la imagen en la carpeta `img/fotos_perfil_personal/`. Asegúrate de que el nombre del archivo de la foto contenga el número de **DNI** del trabajador (ejemplo: `76124515.png` o `FOTO-76124515.jpg`).

> ⚠️ **El DNI del nombre del archivo debe coincidir *exactamente* con el DNI de la columna `DNI` del CSV**, incluidos los ceros a la izquierda. Si Excel guardó el DNI con una comilla invertida delante (`` `00832388``) o le quitó un cero inicial, la foto **no se vinculará** y el fotocheck mostrará el avatar de iniciales aunque la imagen esté en la carpeta. Si una foto no aparece, abre el CSV con el Bloc de notas y revisa ese campo.

### 3. Generar / Actualizar
Abre tu terminal (Símbolo del sistema o PowerShell), asegúrate de estar en la carpeta del proyecto y ejecuta:

```bash
node generar.js
```
*(También puedes usar `npm run generar` si está configurado).*
Esto actualizará el archivo `datos.json` y creará los nuevos códigos QR en la carpeta `qrs/` solo para los nuevos IDs. Los QRs existentes no se sobreescribirán.

### 4. Verificar que todo esté correcto

**Antes de subir nada**, ejecuta el revisor automático:

```bash
node verificar.js
```

Revisa en unos segundos y te dice en español qué está bien y qué no:

| Revisa | Para qué sirve |
|---|---|
| Marcas de conflicto `<<<<<<<` | Que no subas un archivo a medio resolver |
| IDs y DNIs | IDs duplicados o vacíos, DNIs con caracteres raros de Excel, ceros comidos |
| `datos.json` vs CSV | **Avisa si te olvidaste de correr `node generar.js`** — el error más común |
| Fotos | Que cada foto exista, ninguna quede huérfana y no falte vincular |
| QRs | Que cada persona del CSV tenga su QR |
| Brigadas y vigencias | Grupos sin jefe o con dos, y fechas que no existen (ej. `31/09`) |
| Estado de Git | Si GitHub tiene cambios nuevos y **si van a chocar con los tuyos** |

*   ✔ **verde** = correcto.
*   ! **amarillo** = aviso, revísalo pero no impide subir.
*   ✘ **rojo** = error, corrígelo antes de subir.

Si sale todo verde, el push entrará sin problemas.

### 5. Subir los cambios a Internet (GitHub)
Para que los cambios se reflejen cuando alguien escanee el código con su celular, debes subir la actualización ejecutando estos comandos en tu terminal, uno por uno:

```bash
git add .
```
```bash
git commit -m "Actualizar datos del personal"
```
```bash
git pull --rebase origin main
```
```bash
git push origin main
```

El `git pull --rebase` es importante: trae primero los cambios que se hayan hecho desde otra computadora o editando archivos directamente en la web de GitHub. **Si lo saltas y el repositorio remoto ya tenía cambios nuevos, el `push` será rechazado.**

¡Listo! Espera alrededor de 1 minuto y la página web estará actualizada con la nueva información.

#### ⚡ Si aparece un conflicto (`CONFLICT`)

Ocurre cuando el mismo dato se editó en dos lados a la vez. Git deja marcas `<<<<<<<` y `>>>>>>>` dentro del archivo y **no deja subir nada** hasta resolverlo.

Para quedarte con **tu versión local** (lo normal cuando acabas de actualizar el CSV y regenerar todo):

```bash
git checkout --theirs datos.json datos_personal_dengue.csv
```
```bash
git add datos.json datos_personal_dengue.csv
```
```bash
git rebase --continue
```
```bash
git push origin main
```

Si prefieres cancelar todo y volver a como estabas antes de intentar el pull:

```bash
git rebase --abort
```

Para ver en qué estado quedó el repositorio en cualquier momento:

```bash
git status
```

---

## 💻 Requisitos Técnicos (Para el desarrollador)

Si instalas este proyecto en una computadora nueva, necesitarás tener instalado:
*   [Node.js](https://nodejs.org/)
*   [Git](https://git-scm.com/)

Una vez clonado el repositorio, instala las dependencias antes de generar QRs por primera vez:
```bash
npm install
```

---

## 🔑 Que no vuelva a pedir usuario y contraseña

El acceso a GitHub se guarda con **Git Credential Manager**, que almacena el token en el Administrador de credenciales de Windows. Este equipo ya quedó configurado así:

```bash
git config --global credential.helper manager
```
```bash
git config --global credential.credentialStore wincredman
```
```bash
git config --global credential.https://github.com.username redsaludfernando-dev
```

Con eso el `git push` no vuelve a preguntar nada. Si algún día **sí** vuelve a pedir credenciales, casi siempre es porque el token caducó: se abrirá una ventana del navegador para iniciar sesión en GitHub y quedará guardado de nuevo automáticamente.

> 🔒 **Nunca** pongas el token dentro de la URL del repositorio (`https://usuario:token@github.com/...`). Quedaría guardado en texto plano dentro de `.git/config`, visible para cualquiera con acceso a la carpeta.
