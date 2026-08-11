# 🎬 Motor de Overlays ULV — Cómo funciona todo el proyecto

> **Versión del motor:** v7 · **Puerto:** `5000` · **Stack:** Node.js + Express + Vanilla JS + HTML/CSS

---

## 📌 Resumen

Este proyecto es un **sistema de overlays en tiempo real para OBS** (Open Broadcaster Software). Permite mostrar gráficos animados sobre una transmisión en vivo —como cintillas con nombres, versículos bíblicos e himnos— controlados desde un panel web de administración, sin tocar OBS directamente.

---

## 🏗️ Arquitectura General

```
┌──────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL OPERADOR                │
│                      admin.html                          │
│  (selecciona preset → envía datos → llama a /api/update) │
└────────────────────────┬─────────────────────────────────┘
                         │  POST /api/update
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   SERVIDOR  (server.js)                  │
│          Node.js + Express  ·  Puerto 5000               │
│                                                          │
│  • Sirve archivos estáticos (index.html, plantillas…)    │
│  • Escribe config.json al recibir cambios                │
│  • Expone APIs REST para Biblia, Himnario, presets       │
└────────────────────────┬─────────────────────────────────┘
                         │  config.json (se actualiza)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  OBS — Browser Source                    │
│                      index.html                          │
│                                                          │
│  Cada 1 segundo lee config.json → gestiona iframes       │
│  Cada iframe = una capa de overlay visible en la cámara  │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Carpetas

```
ovelay_ulv/
│
├── server.js            ← Servidor principal (Node + Express)
├── index.html           ← Motor de overlays (corre en OBS)
├── admin.html           ← Panel de control para el operador
├── config.json          ← Estado en vivo de todos los overlays
├── package.json
│
├── lower_thirds/        ← Categoría: Cintillas de nombre
│   ├── official_lower/
│   ├── cintilla_ulv_vs01/
│   ├── 2026_graduacion/
│   └── gyd/
│
├── versiculos/          ← Categoría: Versículos bíblicos
│   └── elegante/
│
├── himnarios/           ← Categoría: Himnos
│   └── graduacion_2026/
│
├── creditos/            ← Categoría: Créditos
│   ├── creditos1/
│   └── graduacion_2026/
│
├── bible_versions/      ← Datos: Biblias en XML
│   └── SpanishRVR1960Bible.xml
│
├── himnario_versions/   ← Datos: Himnarios en XML
│   └── himnario_adventista.xml
│
└── presets_db/          ← Presets guardados por categoría
    ├── lower_thirds.json
    ├── versiculos.json
    ├── himnarios.json
    └── creditos.json
```

---

## 🔄 Flujo Completo de un Overlay

### 1. El operador abre `admin.html`

El panel de administración carga automáticamente:
- Las **categorías** disponibles (carpetas del proyecto) desde `/api/init`
- Los **presets guardados** de cada categoría desde `/api/presets/:cat`
- Las **plantillas** disponibles dentro de cada categoría

### 2. El operador activa un preset o configura datos manualmente

Al pulsar **"Enviar al aire"**:
```json
POST /api/update
{
  "lower_thirds": {
    "plantilla": "official_lower",
    "datos": {
      "v1": "Moises",
      "v2": "Martinez",
      "v3": "Adorando con diezmos y ofrendas"
    },
    "update": 1781886051983
  }
}
```
El servidor escribe esos datos en **`config.json`**.

### 3. OBS lee `config.json` cada segundo

El `index.html` dentro de OBS (Browser Source) corre un loop de 1 segundo:

```
sincronizar() cada 1000ms:
  ├── Lee config.json
  ├── Para cada clave en el config (ej: "lower_thirds"):
  │   ├── ¿Misma plantilla que antes?
  │   │   ├── SÍ → solo llama recibirDatos() en el iframe (sin recarga)
  │   │   └── NO → destruye iframe viejo y crea uno nuevo apuntando a
  │   │             /{categoria}/{plantilla}/index.html
  └── Capas que desaparecen del config → fade out + eliminadas
```

### 4. La plantilla recibe los datos y anima

Cada `index.html` de plantilla expone una función global:
```javascript
window.recibirDatos = function(datos) {
  // Actualiza textos e inicia la animación CSS
};
```

El motor padre (`index.html`) la llama vía:
```javascript
iframe.contentWindow?.recibirDatos?.(info.datos ?? {});
```

---

## 🗂️ Tipos de Overlay y sus Plantillas

### 🏷️ Lower Thirds (`lower_thirds/`)
Cintillas animadas con nombre, cargo y subtítulo.

| Campo | Uso |
|-------|-----|
| `v1`  | Nombre principal |
| `v2`  | Apellido o cargo |
| `v3`  | Subtítulo o descripción |
| `v4`  | Campo extra opcional |

### 📖 Versículos (`versiculos/`)
Muestra versículos bíblicos animados. Soporta dos modos:

**Modo texto directo:**
```json
{ "v1": "Texto del versículo", "v2": "Referencia" }
```

**Modo bíblico (consulta automática a la API):**
```json
{
  "isBible": true,
  "params": {
    "ver": "SpanishRVR1960Bible",
    "lib": "Rut",
    "cap": "3",
    "ran": "1-10"
  }
}
```
La plantilla consulta `/api/bible/:version/:book/:chapter` y pagina automáticamente los versículos.

### 🎵 Himnarios (`himnarios/`)
Muestra letras de himnos con navegación de estrofas/coro.

**Modo himno (consulta automática):**
```json
{
  "isHimno": true,
  "params": {
    "ver": "himnario_adventista",
    "num": "141"
  }
}
```
La plantilla consulta `/api/himnario/:version/:numero` y recibe bloques de 2 líneas con el coro ya intercalado entre estrofas.

### 🎬 Créditos (`creditos/`)
Overlay de créditos para cierres de transmisión.

---

## 🌐 API REST del Servidor

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET`  | `/api/init` | Lista de categorías y plantillas del proyecto |
| `POST` | `/api/update` | Actualiza `config.json` (activa overlay en OBS) |
| `GET`  | `/api/presets/:cat` | Lee presets guardados de una categoría |
| `POST` | `/api/presets/:cat` | Guarda presets de una categoría |
| `GET`  | `/api/bible/list` | Lista versiones de Biblia disponibles |
| `GET`  | `/api/bible/:version/metadata` | Lista libros y capítulos de una Biblia |
| `GET`  | `/api/bible/:version/:book/:chapter` | Versos de un capítulo específico |
| `GET`  | `/api/himnario/list` | Lista himnarios disponibles |
| `GET`  | `/api/himnario/:version/metadata` | Lista himnos (número + título) |
| `GET`  | `/api/himnario/:version/:numero` | Bloques procesados de un himno (estrofas + coro) |

---

## ⚙️ config.json — El Estado Central

Este archivo es el **corazón del sistema**. Representa qué overlays están activos y con qué datos:

```json
{
  "lower_thirds": {
    "plantilla": "official_lower",
    "datos": {
      "v1": "Moises",
      "v2": "Martinez",
      "v3": "Adorando con diezmos y ofrendas",
      "v4": ""
    },
    "update": 1781886051983
  }
}
```

- **Clave raíz** → nombre de la categoría (= nombre de la carpeta)
- **`plantilla`** → nombre de la subcarpeta dentro de esa categoría
- **`datos`** → objeto libre que recibe la plantilla vía `recibirDatos()`
- **`update`** → timestamp; si cambia pero la plantilla no, el motor solo llama `recibirDatos()` sin recargar el iframe

> Para **apagar un overlay**, se elimina su clave del `config.json`.

---

## 🖥️ Cómo configurar en OBS

1. Iniciar el servidor: `npm start` (o `npm run dev` para desarrollo)
2. En OBS, agregar una **Browser Source**:
   - URL: `http://localhost:5000/index.html`
   - Resolución: **1920 × 1080**
   - Activar "Shutdown source when not visible"
3. Abrir el panel de control en cualquier navegador:
   - URL: `http://localhost:5000/admin.html`

---

## 💾 Presets

Los presets son configuraciones guardadas que el operador puede cargar con un clic. Se almacenan en `presets_db/` como JSON por categoría:

```json
[
  {
    "label": "Rut 3:1-10",
    "plantilla": "elegante",
    "datos": {
      "isBible": true,
      "params": { "ver": "SpanishRVR1960Bible", "lib": "Rut", "cap": "3", "ran": "1-10" }
    }
  }
]
```

---

## 🧩 Cómo crear una nueva plantilla

1. Crear una carpeta dentro de la categoría correspondiente:
   ```
   lower_thirds/mi_nueva_plantilla/
   └── index.html
   ```

2. En el `index.html`, exponer la función `recibirDatos`:
   ```javascript
   window.recibirDatos = function(datos) {
     document.getElementById("nombre").textContent = datos.v1 ?? "";
     document.getElementById("cargo").textContent  = datos.v2 ?? "";
     // iniciar animación CSS...
   };
   ```

3. El servidor detecta la carpeta automáticamente en `/api/init` y la plantilla aparece en el panel admin **sin necesidad de reiniciar**.

---

## 🛠️ Comandos

```bash
npm install      # Instalar dependencias
npm start        # Iniciar servidor (producción)
npm run dev      # Iniciar con auto-reload (desarrollo)
```

---

## 📦 Dependencias

| Paquete | Versión | Uso |
|---------|---------|-----|
| `express` | ^5.2.1 | Servidor HTTP y rutas API |
| `xml2js` | ^0.6.2 | Parsear archivos XML de Biblia e Himnario |
| `nodemon` | ^3.1.14 | Auto-reinicio del servidor en desarrollo |
