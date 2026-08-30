// assets/js/auth-helper.js

// =====================================================
// HOOK GLOBAL DE CONTROL DE SESIÓN (Intercepción a nivel de raíz)
// =====================================================
(function() {
  const originalGetItem = localStorage.getItem;
  localStorage.getItem = function(key) {
    if (key && key.includes("auth-token") && sessionStorage.getItem("printlab_recovery_mode") === "true") {
      // Permitir lectura única en login.html para que el formulario de recuperación pueda procesar updateUser
      if (!window.location.pathname.toLowerCase().includes("login.html")) {
        return null;
      }
    }
    return originalGetItem.apply(this, arguments);
  };
})();


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
// ACCESO GLOBAL AL CLIENTE SUPABASE
// =====================================================

window.supabaseClient = supabaseClient;


// =====================================================
// MÉTODO GLOBAL DE CIERRE DE SESIÓN
// =====================================================

window.handleLogout = async function() {
  const btn = document.getElementById("btn-logout") || document.querySelector(".user-header-info button");

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Cerrando sesión...";
  }

  try {
    // 1. Forzar destrucción síncrona inmediata del token de sesión de Supabase
    localStorage.removeItem("sb-jmwprzgfdkphbxryjbnr-auth-token");

    // 2. Limpiar caché síncrono al cerrar sesión de forma segura
    localStorage.removeItem("printlab_cached_name");
    localStorage.removeItem("printlab_cached_credits");
    sessionStorage.removeItem("printlab_recovery_mode");
    sessionStorage.removeItem("printlab_auth_redirect");

    // 3. Ejecutar el signOut asíncrono oficial
    await supabaseClient.auth.signOut();

    // 4. Volver siempre al index.html principal
    sessionStorage.removeItem("printlab_auth_redirect");
    window.location.href = "../index.html";

  } catch (error) {
    console.error("Error cerrando sesión, recargando de seguridad:", error);
    window.location.reload();
  }
};


// =====================================================
// ESTILOS DEL HEADER DEL USUARIO Y BOTONES DE CABECERA
// =====================================================

const authHeaderStyles =
  document.createElement("style");

authHeaderStyles.textContent = `

  .auth-buttons {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
  }

  /* ESTILO UNIFICADO CON SOMBREADO 3D PARA BOTONES DE LOGOUT */
  .btn-auth {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 12px 24px !important;
    border-radius: 9999px !important;
    font-weight: 800 !important;
    font-size: 14px !important;
    cursor: pointer !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    text-decoration: none !important;
    border: 2px solid var(--ink) !important;
  }

  .btn-auth.light {
    background: #fff !important;
    color: var(--ink) !important;
    box-shadow: 0 3px 0 var(--ink) !important;
  }

  .btn-auth.light:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 0 var(--ink) !important;
  }

  .btn-auth.light:active {
    transform: translateY(2px) !important;
    box-shadow: 0 1px 0 var(--ink) !important;
  }

  .btn-auth.green {
    background: var(--accent) !important;
    color: var(--ink) !important;
    box-shadow: 0 3px 0 var(--ink) !important;
  }

  .btn-auth.green:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 0 var(--ink) !important;
  }

  .btn-auth.green:active {
    transform: translateY(2px) !important;
    box-shadow: 0 1px 0 var(--ink) !important;
  }

  .user-header-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .user-greeting {
    font-weight: 700;
    font-size: 15px;
    color: var(--ink);
    white-space: nowrap;
  }

  .credits-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: var(--ink);
    padding: 8px 18px;
    border-radius: 9999px;
    border: none;
    font-weight: 800;
    font-size: 15px;
    line-height: 1;
    white-space: nowrap;
  }

  .user-header-info .btn-auth.light {
    background: #fff !important;
    color: var(--ink) !important;
    cursor: pointer !important;
    padding: 10px 20px !important;
    border-radius: 9999px !important;
    font-weight: 800 !important;
    border: 2px solid var(--ink) !important;
    transition: transform .2s ease, box-shadow .2s ease !important;
    box-shadow: 0 3px 0 var(--ink) !important;
  }

  .user-header-info .btn-auth.light:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 0 var(--ink) !important;
  }

  .user-header-info .btn-auth.light:active {
    transform: translateY(2px) !important;
    box-shadow: 0 1px 0 var(--ink) !important;
  }


  @media(max-width:768px){

    .user-header-info{
      gap:8px;
    }

    .user-greeting{
      font-size:13px;
    }

    .credits-badge{
      padding:4px 10px;
      min-height:auto;
      font-size:13px;
      border-radius: 9999px;
    }

    .user-header-info .btn-auth.light{
      padding:8px 14px !important;
      font-size:13px !important;
    }

  }

`;

document.head.appendChild(
  authHeaderStyles
);


// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    // -------------------------------------------------
    // Transición suave entre páginas
    // -------------------------------------------------

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


    // -------------------------------------------------
    // Inicializar autenticación
    // -------------------------------------------------

    initAuth();

  }
);


// =====================================================
// GESTIÓN DE AUTENTICACIÓN
// =====================================================

async function initAuth() {

  let user = null;

  // ===================================================
  // ELEMENTOS DE LA PÁGINA
  // ===================================================

  const authButtons =
    document.querySelector(
      ".auth-buttons"
    );


  const greetingDashboard =
    document.getElementById(
      "dashboard-greeting"
    );


  // ===================================================
  // DETECTOR DE RUTAS JERÁRQUICAS (Previene errores 404)
  // ===================================================

  const currentPathname = window.location.pathname.toLowerCase();
  let pathPrefix = "";

  if (currentPathname.includes("/herramientas/")) {
    pathPrefix = "";
  } else if (currentPathname.includes("/guias/") || currentPathname.includes("/materiales/")) {
    pathPrefix = "../herramientas/";
  } else {
    // Si no está en ninguna carpeta, asume que está en el directorio raíz (index.html)
    pathPrefix = "herramientas/";
  }


  // ===================================================
  // DETECCIÓN GLOBAL DE MODO DE RECUPERACIÓN (Inmune a la navegación)
  // ===================================================

  const isRecovery =
    window.location.hash.includes("type=recovery") ||
    window.location.hash.includes("access_token=") ||
    window.location.search.includes("type=recovery") ||
    sessionStorage.getItem("printlab_recovery_mode") === "true";


  if (
    window.location.hash.includes("type=recovery") ||
    window.location.hash.includes("access_token=") ||
    window.location.search.includes("type=recovery")
  ) {

    sessionStorage.setItem("printlab_recovery_mode", "true");

  }


  // ===================================================
  // PRE-CARGA SÍNCRONA DE SESIÓN MEDIANTE CACHÉ LOCAL
  // ===================================================

  const tokenStr = localStorage.getItem("sb-jmwprzgfdkphbxryjbnr-auth-token");

  if (tokenStr && !isRecovery) {

    try {

      const tokenData = JSON.parse(tokenStr);
      const sessionUser = tokenData?.user;

      if (sessionUser) {

        user = sessionUser; // Pre-cargar el usuario síncronamente


        // Recuperar valores de caché síncronos para eliminar el parpadeo de "85"
        const cachedName = localStorage.getItem("printlab_cached_name") || user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
        const cachedCredits = localStorage.getItem("printlab_cached_credits") || "...";


        // Pintar la cabecera síncronamente en el acto
        if (authButtons) {

          authButtons.innerHTML = `

            <div class="user-header-info">

              <span class="user-greeting">
                Hola, ${cachedName}
              </span>

              <span class="credits-badge">
                Créditos: ${cachedCredits}
              </span>

              <button
                id="btn-logout"
                class="btn-auth light"
                type="button"
                onclick="handleLogout()"
              >
                Cerrar Sesión
              </button>

            </div>

          `;

          authButtons.style.opacity = "1";
          authButtons.style.visibility = "visible";

        }


        // Pintar el dashboard de bienvenida de inmediato
        if (greetingDashboard) {

          const creditsText = cachedCredits !== "..." ? `Dispones de ${cachedCredits} créditos` : "Cargando créditos...";

          greetingDashboard.innerHTML = `Hola, ${cachedName} | ${creditsText}`;

          greetingDashboard.style.setProperty("background", "rgba(184, 255, 61, 0.2)", "important");

          greetingDashboard.style.setProperty("color", "var(--ink)", "important");

        }

      }

    } catch (e) {

      console.warn("Error en pre-carga de sesión:", e);

    }

  }


  // ===================================================
  // COMPROBACIÓN ASÍNCRONA REAL CON SUPABASE
  // ===================================================

  try {

    if (isRecovery) {

      // Bloquear cualquier comprobación de usuario si estamos en modo recuperación
      user = null;

    } else {

      const {
        data,
        error
      } =
        await supabaseClient.auth.getUser();


      if (error) {

        console.warn(
          "No se pudo obtener el usuario:",
          error
        );

        user = null; // Si da error, limpiamos el estado síncrono

      } else {

        user =
          data?.user || null;

      }

    }

  } catch (error) {

    console.error(
      "Error comprobando autenticación:",
      error
    );

    user = null;

  }


  // ===================================================
  // USUARIO LOGUEADO (Actualiza la caché con los datos del servidor)
  // ===================================================

  if (user) {

    let profile = null;


    // -------------------------------------------------
    // OBTENER PERFIL
    // -------------------------------------------------

    try {

      const result =
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


      profile =
        result.data || null;


    } catch (error) {

      console.warn(
        "No se pudo cargar el perfil:",
        error
      );

    }


    // -------------------------------------------------
    // NOMBRE
    // -------------------------------------------------

    const name =
      profile?.full_name ||
      user.email?.split("@")[0] ||
      "Usuario";


    // -------------------------------------------------
    // CRÉDITOS
    // -------------------------------------------------

    let credits =
      profile?.credits ?? 0;


    // --- PROTECCIÓN OPTIMISTA SÍNCRONA ---
    // Si estamos en la página de éxito de checkout, no permitimos que un saldo desactualizado (menor) de la base de datos
    // machaque el saldo optimista actualizado de la caché.
    if (window.location.pathname.toLowerCase().includes("checkout-success.html")) {

      const cached = parseInt(
        localStorage.getItem("printlab_cached_credits")
      );

      if (!isNaN(cached) && cached > credits) {
        credits = cached;
      }

    }


    // Actualizar la caché local para el siguiente refresco instantáneo
    localStorage.setItem(
      "printlab_cached_name",
      name
    );

    localStorage.setItem(
      "printlab_cached_credits",
      credits
    );


    // =================================================
    // ACTUALIZAR HEADER CON DATOS REALES
    // =================================================

    if (authButtons) {

      authButtons.innerHTML = `

        <div class="user-header-info">

          <span class="user-greeting">
            Hola, ${name}
          </span>


          <span class="credits-badge">
            Créditos: ${credits}
          </span>


          <button
            id="btn-logout"
            class="btn-auth light"
            type="button"
            onclick="handleLogout()"
          >
            Cerrar Sesión
          </button>

        </div>

      `;

      // Hace visible la cabecera una vez determinado el estado de la sesión
      authButtons.style.opacity = "1";
      authButtons.style.visibility = "visible";

    }


    // =================================================
    // DASHBOARD (Unificado en una sola línea y fondo verde)
    // =================================================

    if (greetingDashboard) {

      greetingDashboard.innerHTML = `Hola, ${name} | Dispones de ${credits} créditos`;
      
      greetingDashboard.style.setProperty("background", "rgba(184, 255, 61, 0.2)", "important");

      greetingDashboard.style.setProperty("color", "var(--ink)", "important");

    }


    // -------------------------------------------------
    // IMPORTANTE:
    // Si hay usuario, terminamos aquí.
    // No tocamos ningún formulario de login.
    // -------------------------------------------------

    return;

  }


  // ===================================================
  // USUARIO SIN SESIÓN (Se resuelven las rutas según la carpeta)
  // ===================================================

  const currentPage =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();


  if (authButtons) {

    authButtons.innerHTML = `

      <a
        href="${pathPrefix}login.html"
        class="btn-auth light"
        onclick="sessionStorage.removeItem('printlab_recovery_mode'); localStorage.removeItem('sb-jmwprzgfdkphbxryjbnr-auth-token');"
      >
        Iniciar Sesión
      </a>

      <a
        href="${pathPrefix}registro.html"
        id="header-register-link"
        class="btn-auth green"
        onclick="sessionStorage.removeItem('printlab_recovery_mode'); localStorage.removeItem('sb-jmwprzgfdkphbxryjbnr-auth-token');"
      >
        Registrarse
      </a>

    `;


    // Si estamos en login o registro, ajustar el enlace dinámico de la cabecera
    const headerRegLink =
      document.getElementById(
        "header-register-link"
      );

    if (headerRegLink) {

      const loginParams =
        new URLSearchParams(
          window.location.search
        );

      let redir =
        loginParams.get("redirect") ||
        sessionStorage.getItem(
          "printlab_auth_redirect"
        ) ||
        "../index.html";

      headerRegLink.href =
        `${pathPrefix}registro.html?redirect=${encodeURIComponent(redir)}`;

    }


    // Hace visible la cabecera en el estado deslogueado
    authButtons.style.opacity = "1";
    authButtons.style.visibility = "visible";

  }


  // ===================================================
  // SOLO INFORME PRIVADO (Búsqueda por coincidencia de cadena)
  // ===================================================

  if (currentPathname.includes("informe-stl")) {

    const redirect =
      encodeURIComponent(
        "informe-stl.html"
      );


    window.location.href =
      pathPrefix + "login.html?redirect=" +
      redirect;

  }

}
