# MyFi

App de control de ingresos, gastos y metas de ahorro. Hecha con React + Vite.

## 1. Probarla en tu computadora (opcional)

```bash
npm install
npm run dev
```

## 2. Publicarla en internet (necesario para generar el APK)

La forma más simple es con **Vercel**:

1. Crea una cuenta gratis en https://vercel.com (puedes usar tu cuenta de GitHub)
2. Sube esta carpeta a un repositorio nuevo en https://github.com (crea una cuenta si no tienes)
3. En Vercel, click en "Add New Project" → selecciona el repositorio → deja la configuración por defecto (Vite la detecta sola) → "Deploy"
4. En un par de minutos tendrás una URL pública, algo como `https://myfi-tuusuario.vercel.app`

## 3. Generar el APK con PWABuilder

1. Entra a https://www.pwabuilder.com
2. Pega la URL que te dio Vercel y presiona "Start"
3. PWABuilder va a analizar el sitio (ya incluye el manifest e íconos configurados)
4. Click en "Package for stores" → elige **Android**
5. Descarga el paquete: te da un `.apk` para instalar directamente en un celular, o un `.aab` si más adelante quieres publicarla en Google Play

## Notas

- Los datos (ingresos, gastos, metas) se guardan en el propio celular con `localStorage`. Si desinstalas la app o borras datos del navegador, se pierden.
- El ícono está en `public/icons/`. Si quieres cambiarlo, reemplaza esos archivos manteniendo los mismos nombres y tamaños.
