// Minimal Deno sandbox: download a dummy CSV and upload it back

function htmlPage(title: string, bodyContent: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 2rem; line-height: 1.5; }
    .container { max-width: 720px; }
    a.button, button { display: inline-block; padding: .6rem 1rem; border-radius: .5rem; border: 1px solid #8884; text-decoration: none; }
    .muted { opacity: .8; font-size: .95rem; }
    header { margin-bottom: 1.25rem; }
    nav a { margin-right: .75rem; }
    form { margin-top: 1rem; }
    .success { padding: .75rem 1rem; border: 1px solid #2a96344d; background: #2a96340f; border-radius: .5rem; }
    .error { padding: .75rem 1rem; border: 1px solid #b000204d; background: #b000200f; border-radius: .5rem; }
    code { padding: .125rem .375rem; border-radius: .25rem; background: #8882; }
  </style>
  <link rel="icon" href="data:," />
 </head>
<body>
  <div class="container">
    <header>
      <h1>${title}</h1>
      <nav>
        <a href="/">Inicio</a>
        <a href="/upload">Subir CSV</a>
        <a href="/download.csv">Descargar CSV</a>
      </nav>
    </header>
    ${bodyContent}
    <p class="muted">Sandbox Deno • Ruta actual: <code id="path"></code></p>
  </div>
  <script>document.getElementById('path').textContent = location.pathname;</script>
</body>
</html>`;
}

const dummyCsvContent = [
  "id,name,amount",
  "1,Alice,100",
  "2,Bob,200",
  "3,Charlie,300",
].join("\n") + "\n";

function homePage(): Response {
  const body = `
    <p>Bienvenido. Este entorno de pruebas permite:</p>
    <ul>
      <li>Descargar un CSV de ejemplo desde <a href="/download.csv">/download.csv</a>.</li>
      <li>Ir a la página de subida en <a href="/upload">/upload</a> y subir el CSV.</li>
    </ul>
    <p>
      Acciones rápidas:
      <a class="button" href="/download.csv">Descargar CSV dummy</a>
      <a class="button" href="/upload">Ir a Subir CSV</a>
    </p>
  `;
  return new Response(htmlPage("Sandbox CSV (Deno)", body), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function uploadForm(messageHtml = ""): Response {
  const body = `
    ${messageHtml}
    <p>Selecciona un archivo CSV para subir. Puedes usar el CSV dummy descargado desde la página de inicio.</p>
    <form method="POST" action="/upload" enctype="multipart/form-data">
      <input type="file" name="file" accept=".csv,text/csv" required />
      <button type="submit">Subir</button>
    </form>
    <p class="muted">Campo esperado: <code>file</code></p>
  `;
  return new Response(htmlPage("Subir CSV", body), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function handleUpload(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const fileField = formData.get("file");

    if (!(fileField instanceof File)) {
      return uploadForm(
        '<div class="error">No se encontró el archivo en el campo <code>file</code>.</div>',
      );
    }

    const fileName = fileField.name || "archivo.csv";
    const isCsv = fileName.toLowerCase().endsWith(".csv");
    const fileText = await fileField.text();
    const sizeBytes = new TextEncoder().encode(fileText).length; // consistent size in bytes

    if (!isCsv) {
      return uploadForm(
        `<div class="error">El archivo <code>${fileName}</code> no parece ser un .csv</div>`,
      );
    }

    // Validación mínima: debe contener al menos una coma y un salto de línea
    if (!fileText.includes(",") || !/\n/.test(fileText)) {
      return uploadForm(
        '<div class="error">El contenido no parece un CSV válido.</div>',
      );
    }

    const success = `
      <div class="success">
        <strong>Subida correcta.</strong>
        <div>Archivo: <code>${fileName}</code></div>
        <div>Tamaño: ${sizeBytes} bytes</div>
      </div>
      <p>
        Puedes volver a <a href="/">inicio</a> o subir otro archivo.
      </p>
    `;

    return uploadForm(success);
  } catch (error) {
    const details = (error instanceof Error) ? error.message : String(error);
    return uploadForm(
      `<div class="error">Error al procesar la subida: ${details}</div>`,
    );
  }
}

function downloadCsv(): Response {
  const headers = new Headers({
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": 'attachment; filename="dummy.csv"',
    "cache-control": "no-store",
  });
  return new Response(dummyCsvContent, { headers });
}

function notFound(): Response {
  const body = `
    <div class="error">Recurso no encontrado.</div>
    <p><a href="/">Volver al inicio</a></p>
  `;
  return new Response(htmlPage("404", body), {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === "GET" && pathname === "/") {
    return homePage();
  }

  if (request.method === "GET" && pathname === "/download.csv") {
    return downloadCsv();
  }

  if (pathname === "/upload") {
    if (request.method === "GET") return uploadForm();
    if (request.method === "POST") return await handleUpload(request);
  }

  return notFound();
});

