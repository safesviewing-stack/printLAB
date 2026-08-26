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
// MÉTODO GLOBAL DE CIERRE DE SESIÓN (Inmune a demoras de carga y URLs limpias)
// =====================================================

window.handleLogout = async function() {
  const btn = document.getElementById("btn-logout") || document.querySelector(".user-header-info button");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Cerrando sesión...";
  }

  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Error cerrando sesión:", error);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Cerrar Sesión";
      }
      return;
    }

    // Determinar la página actual de forma robusta
    const currentPathname = window.location.pathname.toLowerCase();

    // Redirección directa al inicio (index.html) si estamos en el informe (con o sin .html)
    if (currentPathname.includes("informe-stl")) {
      sessionStorage.removeItem("printlab_auth_redirect");
      window.location.href = "../index.html";
    } else {
      window.location.reload();
    }

  } catch (error) {
    console.error("Error cerrando sesión:", error);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Cerrar Sesión";
    }
  }
};


// =====================================================
// ESTILOS DEL HEADER DEL USUARIO
// =====================================================

const authHeaderStyles =
  document.createElement("style");

authHeaderStyles.textContent = `

  .auth-buttons {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
  }

  .user-header-info{
    display:flex;
    align-items:center;
    gap:16px;
  }

  .user-greeting{
    font-weight:700;
    font-size:15px;
    color:var(--ink);
    white-space:nowrap;
  }

  .credits-badge{
    display:inline-flex;
    align-items:center;
    justify-content:center;

    background:var(--accent);
    color:var(--ink);

    padding:8px 18px;

    border-radius:9999px;
    border:none;

    font-weight:800;
    font-size:15px;
    line-height:1;

    white-space:nowrap;
  }

  .user-header-info .btn-auth.light{
    background:#fff;
    color:var(--ink);

    cursor:pointer;

    padding:10px 20px;

    border-radius:9999px;

    font-weight:800;

    border:2px solid var(--ink);

    transition:
      transform .2s ease,
      box-shadow .2s ease;
  }

  .user-header-info .btn-auth.light:hover{
    transform:translateY(-1px);
    box-shadow:0 4px 0 var(--ink);
  }

  .user-header-info .btn-auth.light:active{
    transform:translateY(2px);
    box-shadow:0 1px 0 var(--ink);
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
      border-radius:9999px;
    }

    .user-header-info .btn-auth.light{
      padding:8px 14px;
      font-size:13px;
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
  // PRE-CARGA SÍNCRONA DE SESIÓN (Elimina demoras de red)
  // ===================================================

  const tokenStr = localStorage.getItem("sb-jmwprzgfdkphbxryjbnr-auth-token");
  if (tokenStr && !isRecovery) {
    try {
      const tokenData = JSON.parse(tokenStr);
      const sessionUser = tokenData?.user;
      if (sessionUser) {
        user = sessionUser; // Pre-cargar el usuario síncronamente

        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";

        // Pintar la cabecera síncronamente en el acto
        if (authButtons) {
          authButtons.innerHTML = `
            <div class="user-header-info">
              <span class="user-greeting">
                Hola, ${name}
              </span>
              <span class="credits-badge">
                Créditos: ...
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

        // Pintar el dashboard de bienvenida del inicio de inmediato
        if (greetingDashboard) {
          greetingDashboard.innerHTML = `Hola, ${name} | Cargando créditos...`;
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
  // USUARIO LOGUEADO
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

    const credits =
      profile?.credits ?? 0;


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
      <a href="${pathPrefix}login.html" class="btn-auth light" onclick="sessionStorage.removeItem('printlab_recovery_mode'); localStorage.removeItem('sb-jmwprzgfdkphbxryjbnr-auth-token');">Iniciar Sesión</a>
      <a href="${pathPrefix}registro.html" id="header-register-link" class="btn-auth green" onclick="sessionStorage.removeItem('printlab_recovery_mode'); localStorage.removeItem('sb-jmwprzgfdkphbxryjbnr-auth-token');">Registrarse</a>
    `;

    // Si estamos en login o registro, ajustar el enlace dinámico de la cabecera
    const headerRegLink = document.getElementById("header-register-link");
    if (headerRegLink) {
      const loginParams = new URLSearchParams(window.location.search);
      let redir = loginParams.get("redirect") || sessionStorage.getItem("printlab_auth_redirect") || "../index.html";
      headerRegLink.href = `${pathPrefix}registro.html?redirect=${encodeURIComponent(redir)}`;
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
