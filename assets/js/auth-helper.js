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
// ACCESO GLOBAL AL CLIENTE SUPABASE
// =====================================================

window.supabaseClient = supabaseClient;


// =====================================================
// MÉTODO GLOBAL DE CIERRE DE SESIÓN (Inmune a demoras de carga)
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

    // Determinar la página actual
    const currentPathname = window.location.pathname.toLowerCase();
    const currentPage = currentPathname.split("/").pop().toLowerCase();

    // Redirección directa al inicio si estamos en el informe
    if (currentPage === "informe-stl.html") {
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
  // COMPROBAR SESIÓN
  // ===================================================

  try {

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

    } else {

      user =
        data?.user || null;

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
    // ACTUALIZAR HEADER
    // =================================================

    if (authButtons) {

      // Se integra la llamada síncrona handleLogout() en línea en el evento onclick
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
      <a href="${pathPrefix}login.html" class="btn-auth light">Iniciar Sesión</a>
      <a href="${pathPrefix}registro.html" id="header-register-link" class="btn-auth green">Registrarse</a>
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
  // SOLO INFORME PRIVADO
  // ===================================================

  if (
    currentPage ===
    "informe-stl.html"
  ) {

    const redirect =
      encodeURIComponent(
        "informe-stl.html"
      );


    window.location.href =
      pathPrefix + "login.html?redirect=" +
      redirect;

  }

}
