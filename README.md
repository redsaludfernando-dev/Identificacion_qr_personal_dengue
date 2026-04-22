# Sistema de Identificación QR - Personal Dengue 🦟

Este proyecto es una aplicación web y generador de códigos QR para el **Equipo de Vigilancia y Control Vectorial** de la **Unidad de Gestión Territorial de Salud - UNGET Rioja**.

Permite identificar al personal de campo mediante el escaneo de un código QR único que muestra un fotocheck digital con sus datos oficiales.

## 🌟 Características

*   **Generador Automático:** Crea un código QR único por cada persona listada en el archivo Excel/CSV.
*   **Fotocheck Digital:** Muestra un diseño profesional con el logo institucional, marca de agua de la campaña, y foto de perfil dinámica basada en las iniciales.
*   **Actualización en Tiempo Real:** Al escanear el QR se lee la información más reciente publicada en la web, sin necesidad de reimprimir los QRs físicos si cambia el cargo o la vigencia.
*   **Alojamiento Gratuito:** Funciona al 100% sobre **GitHub Pages**.

---

## 📂 Estructura del Proyecto

*   `datos_personal_dengue.csv`: **La base de datos.** Aquí está la lista de todo el personal (DNI, Nombres, Cargo, Grupo, Vigencia).
*   `generar.js`: El script (motor) que lee el CSV, crea los QRs y actualiza los datos web.
*   `perfil.html`: La página web que se abre al escanear el QR (el diseño del fotocheck).
*   `estilos.css`: Los colores, logos y fondos de la página web.
*   `img/`: Carpeta con los logos oficiales y la marca de agua del zancudo.
*   `qrs/`: Carpeta donde se guardan automáticamente las imágenes QR generadas, listas para imprimir.
*   `datos.json`: Archivo generado automáticamente. Es el "puente" que permite a la web leer los datos del CSV de forma rápida.

---

## 🛠️ ¿Cómo agregar nuevo personal o actualizar datos?

Si hay nuevo personal en la brigada o alguien cambió de cargo, sigue estos 3 sencillos pasos:

### 1. Actualizar el archivo de datos
Abre el archivo `datos_personal_dengue.csv` (puedes usar Excel, pero asegúrate de guardarlo como "CSV delimitado por comas"). 
*   **Para agregar:** Añade una nueva fila al final con los datos de la persona. **El DNI es obligatorio**, ya que es su identificador único.
*   **Para modificar:** Simplemente cambia el texto en la fila de la persona (ej. cambiar su VIGENCIA).

### 2. Generar los nuevos QRs
Abre tu terminal (Símbolo del sistema o PowerShell), asegúrate de estar en la carpeta del proyecto y ejecuta:

```bash
npm run generar
```
*Esto actualizará el archivo `datos.json` y creará los nuevos códigos QR en la carpeta `qrs/`.*

### 3. Subir los cambios a Internet (GitHub)
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