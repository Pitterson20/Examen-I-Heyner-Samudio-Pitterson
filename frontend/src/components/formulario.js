import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

let iniciado = false;
let alGuardarActual = () => {};

const cargarCategorias = async () => {
  try {
    const respuesta = await listarCategorias();

    for (const categoria of respuesta.data ?? []) {
      const $opcion = document.createElement("option");
      $opcion.value = categoria.id;
      $opcion.textContent = categoria.nombre;
      $selectCategoria.append($opcion);
    }
  } catch (error) {
    mostrarMensaje("error", error.message ?? "No fue posible cargar las categorías.");
  }
};

const limpiarErrores = () => {
  for (const $error of $form.querySelectorAll("[data-error]")) {
    $error.textContent = "";
  }

  for (const $campo of $form.querySelectorAll("[aria-invalid]")) {
    $campo.removeAttribute("aria-invalid");
  }
};

const alEnviar = async (evento) => {
  evento.preventDefault();

  limpiarErrores();

  const datos = Object.fromEntries(new FormData($form));
  datos.categoria_id = Number(datos.categoria_id);
  datos.costo_interno = Number(datos.costo_interno);

  const textoOriginal = $btnGuardar.textContent;
  $btnGuardar.disabled = true;
  $btnGuardar.textContent = "Guardando…";

  try {
    const creado = await crearEquipo(datos);
    const codigo = creado?.data?.codigo ?? datos.codigo;

    $form.reset();
    mostrarMensaje("exito", `Equipo ${codigo} registrado.`);
    await alGuardarActual();
  } catch (error) {
    if (error.status === 422) {
      for (const [campo, mensajes] of Object.entries(error.datos?.errors ?? {})) {
        const $error = $form.querySelector(`[data-error="${campo}"]`);
        if ($error) $error.textContent = mensajes[0] ?? "";

        const $campo = $form.querySelector(`[name="${campo}"]`);
        if ($campo) $campo.setAttribute("aria-invalid", "true");
      }
    } else {
      mostrarMensaje("error", error.message ?? "No fue posible registrar el equipo.");
    }
  } finally {
    $btnGuardar.disabled = false;
    $btnGuardar.textContent = textoOriginal;
  }
};

/**
 * TODO [F3] Formulario de registro de equipos.
 *
 * iniciarFormulario({ alGuardar }):
 *  1. Llene el <select id="categoria_id"> con listarCategorias()
 *     (cree cada <option> con createElement, value = id, texto = nombre).
 *  2. Al enviar el formulario (submit):
 *     - Evite el envío tradicional.
 *     - Limpie los errores anteriores: textContent de [data-error] y aria-invalid de los campos.
 *     - Construya el objeto con FormData. categoria_id y costo_interno deben ir como números.
 *     - Deshabilite #btn-guardar y cambie su texto a "Guardando…" mientras espera.
 *     - Llame a crearEquipo(datos).
 *     - Éxito: limpie el formulario, mostrarMensaje("exito", "Equipo <codigo> registrado.")
 *              y llame a alGuardar().
 *     - 422: por cada campo de error.datos.errors, escriba el PRIMER mensaje en
 *            el <p data-error="<campo>"> y marque el campo con aria-invalid="true".
 *     - Otro error: mostrarMensaje("error", ...).
 *     - Siempre (finally): rehabilite el botón y restaure su texto.
 */
export const iniciarFormulario = ({ alGuardar } = {}) => {
  alGuardarActual = alGuardar ?? (() => {});

  if (iniciado) return;

  iniciado = true;
  $form.addEventListener("submit", alEnviar);
  cargarCategorias();
};
