import { BASE_URL, TIEMPO_MAXIMO_MS } from "./config.js";
import { ErrorApi } from "./errores.js";
import { obtenerToken, olvidarSesion } from "./auth.js";

/**
 * TODO [F1] Cliente HTTP único de la aplicación.
 *
 * request(ruta, opciones) debe:
 *  1. Construir la URL como BASE_URL + ruta   (ej. request("/equipos?page=2"))
 *  2. Enviar siempre "Accept: application/json".
 *  3. Si hay token, enviar "Authorization: Bearer <token>" (nunca en la URL).
 *  4. Si opciones.body es un objeto, enviarlo como JSON
 *     ("Content-Type: application/json" + JSON.stringify).
 *  5. Cancelar la petición si tarda más de TIEMPO_MAXIMO_MS (AbortController).
 *  6. Si la respuesta es 204, devolver null.
 *  7. Si response.ok es false, lanzar new ErrorApi(response.status, cuerpoJson).
 *     Si el estado es 401, además llamar a olvidarSesion() y recargar la página.
 *  8. En cualquier otro caso, devolver el cuerpo JSON.
 *
 * Ningún otro archivo debe llamar a fetch directamente (salvo auth.js, ya hecho).
 */
export const request = async (ruta, opciones = {}) => {
  const { body, headers = {}, ...resto } = opciones;

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  const cabeceras = {
    Accept: "application/json",
    ...headers,
  };

  const token = obtenerToken();
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }

  let cuerpo = body;
  if (body && typeof body === "object") {
    cabeceras["Content-Type"] = "application/json";
    cuerpo = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${ruta}`, {
      ...resto,
      headers: cabeceras,
      body: cuerpo,
      signal: controlador.signal,
    });

    if (response.status === 204) {
      return null;
    }

    const datos = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        olvidarSesion();
        window.location.reload();
      }

      throw new ErrorApi(response.status, datos);
    }

    return datos;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ErrorApi(0, { mensaje: "La petición tardó demasiado. Intente de nuevo." });
    }

    throw error;
  } finally {
    clearTimeout(temporizador);
  }
};
