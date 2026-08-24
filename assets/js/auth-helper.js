// assets/js/auth-helper.js

const SUPABASE_URL =
  "https://jmwprzgfdkphbxryjbnr.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_kelRYJ3Fa56DXY3GhxWLHQ_YiLJzStR";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// =====================================================
// UTILIDADES DE REDIRECCIÓN
// =====================================================

function getRedirectTarget(defaultTarget = "../index.html") {

  const params = new URLSearchParams(
    window.location.search
  );

  const redirect =
    params.get("redirect");

  if (!redirect) {
    return defaultTarget;
  }

  // Evitar redirecciones externas
  if (
    redirect.startsWith("http://") ||
    redirect.startsWith("https://") ||
    redirect.startsWith("//")
  ) {
    return defaultTarget;
  }

  return redirect;
}


function buildAuthUrl(
  page,
  redirectTarget
) {

  return `${page}?redirect=${encodeURIComponent(
    redirectTarget
  )}`;

}


// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initAuth();

  }
);


// =====================================================
// AUTENTICACIÓN
// =====================================================

async function initAuth() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  const authButtons =
    document.querySelector(
      ".auth-buttons"
    );


  const greetingDashboard =
    document.getElementById(
      "dashboard-greeting"
    );


  // ===================================================
  // USUARIO CON SESIÓN
  // ===================================================

  if (user) {

    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "full_name, credits, plan"
        )
        .eq(
          "id",
          user.id
        )
        .single();


    const name =
      profile?.full_name ||
      user.email?.split("@")[0] ||
      "Usuario";


    const credits =
      profile?.credits ?? 0;


    // =================================================
    // HEADER
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
          Hola, ${escapeHtml(name)}
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
        >
          Cerrar Sesión
        </button>

      `;


      const logoutButton =
        document.getElementById(
          "btn-logout"
        );


      if (logoutButton) {

        logoutButton.addEventListener(
          "click",
          async () => {

            logoutButton.disabled = true;

            const {
              error
            } =
              await supabaseClient
                .auth
                .signOut();


            if (error) {

              console.error(
                "Error cerrando sesión:",
                error
              );

              logoutButton.disabled = false;

              return;
            }


            window.location.reload();

          }
        );

      }

    }


    // =================================================
    // DASHBOARD
    // =================================================

    if (greetingDashboard) {

      greetingDashboard.innerHTML = `

        Hola, ${escapeHtml(name)}<br>

        Créditos disponibles:
        <strong>${credits}</strong>

      `;

    }


    // =================================================
    // ANALIZADOR
    // =================================================

    initAnalyzerForAuthenticatedUser(
      user,
      credits
    );


    return;

  }


  // ===================================================
  // USUARIO SIN SESIÓN
  // ===================================================

  initUnauthenticatedUser();

}


// =====================================================
// USUARIO SIN SESIÓN
// =====================================================

function initUnauthenticatedUser() {

  const pathname =
    window.location.pathname;


  // -----------------------------------------------
  // Si estamos en el analizador
  // -----------------------------------------------

  if (
    pathname.includes(
      "analizador-stl.html"
    )
  ) {

    /*
     * IMPORTANTE:
     *
     * Aquí NO mandamos directamente al login.
     *
     * Primero comprobamos si el usuario existe.
     *
     * Como Supabase no permite saber de forma
     * segura desde el navegador si un email existe,
     * la puerta de entrada para un usuario sin sesión
     * será REGISTRO.
     *
     * Si el correo ya existe, registro.html detectará
     * la cuenta y ofrecerá iniciar sesión.
     */

    const redirectTarget =
      "analizador-stl.html";


    const loginUrl =
      buildAuthUrl(
        "login.html",
        redirectTarget
      );


    const registerUrl =
      buildAuthUrl(
        "registro.html",
        redirectTarget
      );


    /*
     * Guardamos las rutas para que el analizador
     * pueda utilizar los botones correctamente.
     */

    window.PRINTLAB_AUTH_REDIRECT =
      redirectTarget;

    window.PRINTLAB_LOGIN_URL =
      loginUrl;

    window.PRINTLAB_REGISTER_URL =
      registerUrl;


    /*
     * Si existe un contenedor de acceso,
     * no mostramos alerts.
     */

    const authRequired =
      document.getElementById(
        "auth-required"
      );


    if (authRequired) {

      authRequired.style.display =
        "block";


      const registerLink =
        authRequired.querySelector(
          "[data-auth-register]"
        );


      const loginLink =
        authRequired.querySelector(
          "[data-auth-login]"
        );


      if (registerLink) {

        registerLink.href =
          registerUrl;

      }


      if (loginLink) {

        loginLink.href =
          loginUrl;

      }

    }

    return;

  }


  // -----------------------------------------------
  // En otras páginas
  // -----------------------------------------------

  /*
   * NO hacemos ninguna redirección automática.
   *
   * Esto es importante para que:
   *
   * Inicio → Registrarse
   *
   * siga su flujo normal.
   *
   * Y:
   *
   * Inicio → Iniciar sesión
   *
   * también siga su flujo normal.
   */

}


// =====================================================
// ANALIZADOR CON SESIÓN
// =====================================================

function initAnalyzerForAuthenticatedUser(
  user,
  credits
) {

  const uploadContainer =
    document.querySelector(
      ".upload-container"
    );


  if (!uploadContainer) {
    return;
  }


  /*
   * Si ya tiene sesión, puede utilizar
   * el analizador directamente.
   */

  const existingInput =
    document.getElementById(
      "stl-file-input"
    );


  if (existingInput) {

    existingInput.addEventListener(
      "change",
      async event => {

        await handleSTLUpload(
          event.target.files[0],
          user,
          credits
        );

      }
    );

  }

}


// =====================================================
// SUBIDA / ANÁLISIS STL
// =====================================================

async function handleSTLUpload(
  file,
  user,
  credits
) {

  if (!file) {
    return;
  }


  if (
    !file.name
      .toLowerCase()
      .endsWith(".stl")
  ) {

    showInlineMessage(
      "Selecciona un archivo STL válido.",
      "error"
    );

    return;

  }


  if (file.size > 100 * 1024 * 1024) {

    showInlineMessage(
      "El archivo supera el límite de 100 MB.",
      "error"
    );

    return;

  }


  if (credits < 1) {

    window.location.href =
      "../herramientas/precios.html";

    return;

  }


  const {
    data: success,
    error: rpcError
  } =
    await supabaseClient.rpc(
      "deduct_analysis_credit"
    );


  if (rpcError || !success) {

    console.error(
      "Error descontando crédito:",
      rpcError
    );


    showInlineMessage(
      "No se ha podido iniciar el análisis. Inténtalo de nuevo.",
      "error"
    );

    return;

  }


  /*
   * Aquí mantienes tu flujo actual de análisis.
   */

  window.location.href =
    "informe-stl.html";

}


// =====================================================
// MENSAJES SIN ALERT
// =====================================================

function showInlineMessage(
  message,
  type = "error"
) {

  let element =
    document.getElementById(
      "auth-inline-message"
    );


  if (!element) {

    element =
      document.createElement(
        "div"
      );

    element.id =
      "auth-inline-message";

    element.style.cssText = `
      margin:16px 0;
      padding:12px 16px;
      border-radius:12px;
      font-size:14px;
      font-weight:700;
    `;


    const container =
      document.querySelector(
        ".upload-container"
      ) ||
      document.querySelector(
        "main"
      );


    if (container) {

      container.prepend(
        element
      );

    }

  }


  element.textContent =
    message;


  if (type === "error") {

    element.style.background =
      "#fff1f0";

    element.style.color =
      "#b42318";

    element.style.border =
      "1px solid #f1c4c0";

  } else {

    element.style.background =
      "#f0faee";

    element.style.color =
      "#246b27";

    element.style.border =
      "1px solid #c7e5c2";

  }

}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escapeHtml(
  value
) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// =====================================================
// ESCUCHAR CAMBIOS DE SESIÓN
// =====================================================

supabaseClient.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      event ===
      "SIGNED_OUT"
    ) {

      /*
       * No redirigimos automáticamente.
       * Cada página decide su propio comportamiento.
       */

      return;

    }


    if (
      event ===
      "SIGNED_IN"
    ) {

      console.log(
        "Sesión iniciada correctamente."
      );

    }


    if (
      event ===
      "PASSWORD_RECOVERY"
    ) {

      console.log(
        "Recuperación de contraseña iniciada."
      );

    }

  }
);
