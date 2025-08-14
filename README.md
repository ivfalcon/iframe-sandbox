# Sandbox de CSV con Deno

Servidor mínimo con dos endpoints:

- `/download.csv`: descarga un CSV dummy.
- `/upload` (GET/POST): formulario para subir un CSV y ver un mensaje de éxito o
  error.

## Requisitos

- Deno 1.42+ instalado. Ver: https://deno.land/#installation

## Ejecutar

```bash
# Desde el directorio del proyecto
deno task dev
```

Abrir `http://localhost:8000`.

## Flujo

1. Visita `/` y descarga el archivo desde `/download.csv`.
2. Ve a `/upload` y sube el CSV descargado.
3. Si todo va bien, verás un mensaje de éxito con el nombre y tamaño del
   archivo.

## Notas

- No se guarda nada en disco; es un entorno efímero para pruebas.
- Validación muy básica del CSV: extensión `.csv` y contenido con comas y saltos
  de línea.

