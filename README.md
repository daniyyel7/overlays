# 📘 Manual Técnico: Sistema Maestro de Overlays v7.0

Este sistema es una infraestructura de transmisión de gráficos en tiempo real basada en una **arquitectura de Bus de Datos**. Utiliza un servidor central para procesar activos y un receptor inteligente que gestiona capas de video transparentes para OBS.

---

## 🏗 Estructura de Archivos y Carpetas

Para que el servidor pueda mapear los recursos, la jerarquía debe ser estricta:

```text
/RAIZ_DEL_PROYECTO
├── server.js               # El Motor (Backend)
├── admin.html              # El Cerebro (Interfaz de Operador)
├── index.html              # El Lienzo (Receptor para OBS)
├── config.json             # El Bus (Archivo de intercambio)
├── presets_db/             # Almacén de archivos .json por categoría
├── bible_versions/         # Biblias en formato .xml
├── assets/                 # Recursos globales (logos, fuentes OTF/TTF)
├── lower_thirds/           # Carpeta de Categoría
│   └── mi_plantilla/       # Carpeta de Plantilla específica
│       ├── index.html      # El diseño
│       └── assets/         # Imágenes/Videos locales
├── versiculos/
    └── mi_plantilla/       # Carpeta de Plantilla específica
        ├── index.html          # El diseño
        └── assets/             # Imágenes/Videos locales
└── creditos/
    └── mi_plantilla/       # Carpeta de Plantilla específica
        ├── index.html          # El diseño
        └── assets/             # Imágenes/Videos locales
```

---

## 🕹 Análisis de Archivos Principales

### 1. server.js (Servidor de Aplicación)

- **Qué es:** Un servidor Node.js usando el framework Express.
- **Qué lee:** Escanea el sistema de archivos buscando carpetas (categorías) y subcarpetas (plantillas). Lee archivos XML y JSON.
- **Funciones Clave:**
  - `GET /api/init` → Mapea automáticamente todas tus carpetas para que aparezcan en el panel.
  - `GET /api/bible/...` → Utiliza un array de nombres en español para traducir los índices del XML.
  - `POST /api/update` → Escribe en `config.json`. Es el puente que envía datos al stream.
- **Activación:** `node server.js` o `npm run dev`.
- **Desactivación:** Cerrar la terminal o `Ctrl + C`.
- **Paquetes de node.js:** express, nodemon, xml2js

### 2. admin.html (Panel de Control)

- **Qué es:** Una aplicación web (SPA) para el operador.
- **Qué hace:** Captura entradas del usuario y las empaqueta para el servidor.
- **Mecánica de Lanzamiento:** Cada vez que pulsas **"Lanzar"**, el sistema añade un `update: Date.now()`. Este pulso de tiempo permite lanzar el mismo gráfico repetidamente.
- **Navegación Bíblica:** Incluye lógica para rangos (ej. 1-5).

### 3. index.html (Receptor Maestro)

- **Qué es:** El gestor de capas para OBS (1920x1080).
- **Mecánica de Sincronización:** Consulta `config.json` cada segundo. Utiliza iframes para cargar las plantillas.
- **Optimización de Capas:** Si la plantilla no cambia, no recarga la página completa, solo actualiza los datos mediante `recibirDatos()`, permitiendo animaciones fluidas.

---

## 🛠 Desarrollo de Plantillas por Categoría

Todas las plantillas deben ser archivos `index.html` y contener la función `window.recibirDatos(datos)`.

### 1. Lower Thirds (Cintillas)

```javascript
window.recibirDatos = function (datos) {
  document.getElementById("nombre").innerText = datos.v1;
  document.getElementById("cargo").innerText = datos.v2;

  const contenedor = document.getElementById("animado");
  contenedor.style.animation = "none"; // Detener
  void contenedor.offsetWidth; // REFLOW (Fuerza reinicio)
  contenedor.style.animation = "entrada 8s forwards"; // Iniciar
};
```

### 2. Versículos (Biblia)

- **Variables:** `datos.v1` (Texto) y `datos.v2` (Cita).

```css
.card {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  height: auto; /* Permite crecimiento suave */
}
```

### 3. Créditos

```javascript
window.recibirDatos = function (datos) {
  let html = "";
  datos.lista.forEach((bloque) => {
    html += `<div class='area'>${bloque.area}</div>`;
    html += `<div class='nombres'>${bloque.nombres.join("<br>")}</div>`;
  });
  document.getElementById("scroll-container").innerHTML = html;
};
```

---

## 🚀 Flujo de Trabajo Operativo

1. **Arranque:** Ejecuta `node server.js`
2. **Preparación:** Abre `admin.html` y crea presets para los momentos clave.
3. **Lanzamiento:** Presiona **"Lanzar"**. El receptor detectará el cambio automáticamente.
4. **Navegación Bíblica:** Usa los botones para avanzar versículo por versículo.

---

## 👥 Créditos y Desarrollo

### Creador y Líder de Proyecto

José Moisés Martínez Hernández - Estudiante de Ingeniería en Desarrollo de Software, ULV.

### Equipo Colaborador

1. Daniel Juarez - Ingeniero en Desarrollo de Software, ULV.
2. Departamento de Proyeccion y Transmisiones, ULV.

### Asistencia Tecnológica

Gemini (Google AI): Colaborador de IA en el diseño de arquitectura, optimización de algoritmos de sincronización y refactorización de código para lanzamientos consecutivos.

---

**Manual Técnico v7.0 — 2026**  
Departamento de Transmisiones Universitarias

---
