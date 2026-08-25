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
// ESTILOS DEL HEADER DEL USUARIO
// =====================================================

const authHeaderStyles =
  document.createElement("style");

authHeaderStyles.textContent = `

  .user-header-info{
    display:flex;
    align-items:center;
    gap:16px;
  }

  .user-greeting{
    font-weight:700;
    font-size:18px;
    color:var(--ink);
    white-space:nowrap;
  }

  .credits-badge{
    display:flex;
    align-items:center;
    justify-content:center;

    background:var(--accent);
    color:var(--ink);

    padding:12px 20px;
    min-height:50px;

    border-radius:17px;
    border:1px solid var(--ink);

    font-weight:800;
    font-size:17px;

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
      font-size:15px;
    }

    .credits-badge{
      padding:10px 14px;
      min-height:44px;
      font-size:14px;
      border-radius:14px;
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
          >
            Cerrar Sesión
          </button>

        </div>

      `;


      // ===============================================
      // BOTÓN CERRAR SESIÓN
      // ===============================================

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


              // ---------------------------------------
              // Sesión cerrada correctamente
              // ---------------------------------------

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


    // -------------------------------------------------
    // IMPORTANTE:
    // Si hay usuario, terminamos aquí.
    // No tocamos ningún formulario de login.
    // -------------------------------------------------

    return;

  }


  // ===================================================
  // USUARIO SIN SESIÓN
  // ===================================================

  const currentPage =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();


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
      "login.html?redirect=" +
      redirect;

  }

}
