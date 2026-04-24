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
*   `perfil.html`: La página web que se abre al escanear el QR (el diseño del fotocheck).
*   `estilos.css`: Los colores, logos y fondos de la página web.
*   `img/fotos_perfil_personal/`: Carpeta donde se guardan las fotos del personal. El nombre del archivo debe contener el **DNI** de la persona (ej. `Juan Perez-76124515.jpg`).
*   `img/`: Carpeta con los logos oficiales y la marca de agua del zancudo.
*   `qrs/`: Carpeta donde se guardan automáticamente las imágenes QR generadas (`1.png`, `2.png`, etc.), listas para imprimir.
*   `datos.json`: Archivo generado automáticamente. Es el "puente" que permite a la web leer los datos del CSV de forma rápida.

---

## 🛠️ ¿Cómo agregar nuevo personal o actualizar datos?

Si hay nuevo personal en la brigada o alguien cambió de cargo, sigue estos pasos:

### 1. Actualizar el archivo de datos
Abre el archivo `datos_personal_dengue.csv`.
*   **Para agregar:** Añade una nueva fila al final con los datos de la persona. **El `ID` es obligatorio y debe ser único**, ya que será el código permanente de su QR. El **DNI** también es necesario para vincular su foto de perfil.
*   **Para modificar datos:** Simplemente cambia el texto en la fila de la persona (ej. cambiar su CARGO o VIGENCIA). **No cambies el `ID`**, para que su QR físico siga funcionando.

### 2. Actualizar Foto de Perfil (Opcional)
Si deseas agregar o actualizar la foto de un trabajador, simplemente guarda la imagen en la carpeta `img/fotos_perfil_personal/`. Asegúrate de que el nombre del archivo de la foto contenga el número de **DNI** del trabajador (ejemplo: `76124515.png` o `FOTO-76124515.jpg`).

### 3. Generar / Actualizar
Abre tu terminal (Símbolo del sistema o PowerShell), asegúrate de estar en la carpeta del proyecto y ejecuta:

```bash
node generar.js
```
*(También puedes usar `npm run generar` si está configurado).*
Esto actualizará el archivo `datos.json` y creará los nuevos códigos QR en la carpeta `qrs/` solo para los nuevos IDs. Los QRs existentes no se sobreescribirán.

### 4. Subir los cambios a Internet (GitHub)
Para que los cambios se reflejen cuando alguien escanee el código con su celular, debes subir la actualización ejecutando estos tres comandos en tu terminal uno por uno:

```bash
git add .
git commit -m "Actualizar datos del personal"
git push origin main
```

¡Listo! Espera alrededor de 1 minuto y la página web estará actualizada con la nueva información.

---

## 💻 Requisitos Técnicos (Para el desarrollador)

Si instalas este proyecto en una computadora nueva, necesitarás tener instalado:
*   [Node.js](https://nodejs.org/)
*   [Git](https://git-scm.com/)

Una vez clonado el repositorio, instala las dependencias antes de generar QRs por primera vez:
```bash
npm install
```