// assets/js/auth-helper.js

// =====================================================
// CONFIGURACIÓN DE SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://jmwprzgfdkphbxryjbnr.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_kelRYJ3Fa56DXY3GhxWLHQ_YiLJzStR";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------
  // Transición suave entre páginas
  // ---------------------------------------------------

  const prefersReduced =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (!prefersReduced) {

    document.body.style.opacity = "0";
    document.body.style.transition =
      "opacity 0.2s ease-in-out";

    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 50);

  }


  // ---------------------------------------------------
  // Inicializar autenticación
  // ---------------------------------------------------

  initAuth();

});


// =====================================================
// GESTIÓN DE AUTENTICACIÓN
// =====================================================

async function initAuth() {

  let user = null;

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getUser();

    if (error) {

      console.warn(
        "No se pudo obtener el usuario:",
        error
      );

    } else {

      user = data?.user || null;

    }

  } catch (error) {

    console.error(
      "Error comprobando autenticación:",
      error
    );

  }


  // ===================================================
  // ELEMENTOS DE LA PÁGINA
  // ===================================================

  const authButtons =
    document.querySelector(".auth-buttons");

  const greetingDashboard =
    document.getElementById(
      "dashboard-greeting"
    );


  // ===================================================
  // USUARIO LOGUEADO
  // ===================================================

  if (user) {

    let profile = null;

    try {

      const result =
        await supabaseClient
          .from("profiles")
          .select(
            "full_name, credits, plan"
          )
          .eq("id", user.id)
          .single();

      profile = result.data || null;

    } catch (error) {

      console.warn(
        "No se pudo cargar el perfil:",
        error
      );

    }


    const name =
      profile?.full_name ||
      user.email?.split("@")[0] ||
      "Usuario";


    const credits =
      profile?.credits ?? 0;


    // =================================================
    // ACTUALIZAR HEADER
    // =================================================

    if (authButtons) {

      authButtons.innerHTML = `

        <span
          style="
            font-weight:700;
            font-size:14px;
            margin-right:8px;
          "
        >
          Hola, ${name}
        </span>

        <span
          style="
            background:var(--accent);
            color:var(--ink);
            padding:5px 12px;
            border-radius:10px;
            font-weight:800;
            font-size:13px;
            margin-right:16px;
          "
        >
          Créditos: ${credits}
        </span>

        <button
          id="btn-logout"
          class="btn-auth light"
          type="button"
          style="
            background:#fff;
            cursor:pointer;
            padding:10px 20px;
            border-radius:9999px;
            font-weight:800;
            border:2px solid var(--ink);
          "
        >
          Cerrar Sesión
        </button>

      `;


      // -----------------------------------------------
      // CERRAR SESIÓN
      // -----------------------------------------------

      const logoutButton =
        document.getElementById(
          "btn-logout"
        );


      if (logoutButton) {

        logoutButton.addEventListener(
          "click",
          async () => {

            logoutButton.disabled = true;
            logoutButton.textContent =
              "Cerrando sesión...";


            try {

              const {
                error
              } =
                await supabaseClient.auth.signOut();


              if (error) {

                console.error(
                  "Error cerrando sesión:",
                  error
                );

                logoutButton.disabled =
                  false;

                logoutButton.textContent =
                  "Cerrar Sesión";

                return;
              }


              /*
               * No mostramos ningún alert.
               * Simplemente recargamos la página.
               */

              window.location.reload();

            } catch (error) {

              console.error(
                "Error cerrando sesión:",
                error
              );

              logoutButton.disabled =
                false;

              logoutButton.textContent =
                "Cerrar Sesión";

            }

          }
        );

      }

    }


    // =================================================
    // DASHBOARD
    // =================================================

    if (greetingDashboard) {

      greetingDashboard.innerHTML = `
        Hola, ${name}<br>
        Créditos disponibles:
        <strong>${credits}</strong>
      `;

    }


    /*
     * IMPORTANTE
     *
     * AQUÍ YA NO TOCAMOS .upload-container
     *
     * El analizador-stl.html se encarga
     * completamente de su propio botón,
     * selector STL y flujo de acceso.
     *
     * Esto evita que auth-helper.js
     * sobrescriba el botón del analizador.
     */

    return;

  }


  // ===================================================
  // USUARIO SIN SESIÓN
  // ===================================================

  /*
   * IMPORTANTE:
   *
   * NO redirigimos automáticamente
   * desde analizador-stl.html.
   *
   * El usuario puede entrar en el analizador
   * sin estar logueado.
   *
   * Será el botón del propio analizador
   * el que lo llevará al login.
   */


  const currentPage =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();


  // ===================================================
  // SOLO INFORME PRIVADO
  // ===================================================

  if (
    currentPage === "informe-stl.html"
  ) {

    const redirect =
      encodeURIComponent(
        "informe-stl.html"
      );


    window.location.href =
      "login.html?redirect=" +
      redirect;

  }

}
