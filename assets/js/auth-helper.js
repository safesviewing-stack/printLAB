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

  // Transición suave entre páginas
  const prefersReduced = window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .matches;

  if (!prefersReduced) {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.2s ease-in-out";

    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 50);
  }

  initAuth();
});


// =====================================================
// GESTIÓN DE AUTENTICACIÓN
// =====================================================

async function initAuth() {

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  const authButtons =
    document.querySelector(".auth-buttons");

  const greetingDashboard =
    document.getElementById("dashboard-greeting");


  // ===================================================
  // USUARIO CON SESIÓN INICIADA
  // ===================================================

  if (user) {

    // -----------------------------------------------
    // Recuperar perfil
    // -----------------------------------------------

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, credits, plan")
      .eq("id", user.id)
      .single();


    const name =
      profile?.full_name ||
      user.email.split("@")[0];

    const credits =
      profile?.credits ?? 0;


    // -----------------------------------------------
    // Actualizar botones de autenticación
    // -----------------------------------------------

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


      // ---------------------------------------------
      // Cerrar sesión
      // ---------------------------------------------

      const logoutButton =
        document.getElementById("btn-logout");

      if (logoutButton) {

        logoutButton.addEventListener(
          "click",
          async () => {

            await supabaseClient.auth.signOut();

            // Recargar la página sin mostrar ningún alert
            window.location.reload();

          }
        );

      }

    }


    // =================================================
    // SALUDO DEL DASHBOARD
    // =================================================

    if (greetingDashboard) {

      greetingDashboard.innerHTML = `
        Hola, ${name}<br>
        Créditos disponibles:
        <strong>${credits}</strong>
      `;

    }


    // =================================================
    // ANALIZADOR STL
    // =================================================

    const uploadContainer =
      document.querySelector(".upload-container");


    if (uploadContainer) {

      uploadContainer.innerHTML = `

        <div class="upload-icon">
          📁
        </div>

        <h3 class="upload-title">
          Analizar nuevo modelo STL
        </h3>

        <p class="upload-desc">
          Soporte para FDM, SLA/MSLA y SLS.
          Límite: 100MB por archivo.
        </p>

        <input
          type="file"
          id="stl-file-input"
          accept=".stl"
          style="display:none;"
        />

        <button
          id="btn-select-file"
          class="btn-green"
        >
          Seleccionar archivo STL
        </button>

        <div class="privacy-badge">
          <span>
            🔒 Privacidad por Diseño
          </span>
          Archivos cifrados.
          No entrenamos IAs con tus prototipos.
        </div>

      `;


      // ---------------------------------------------
      // Botón seleccionar archivo
      // ---------------------------------------------

      const selectButton =
        document.getElementById("btn-select-file");

      const fileInput =
        document.getElementById("stl-file-input");


      if (selectButton && fileInput) {

        selectButton.addEventListener(
          "click",
          () => {
            fileInput.click();
          }
        );


        // -------------------------------------------
        // Cuando se selecciona un STL
        // -------------------------------------------

        fileInput.addEventListener(
          "change",
          async (e) => {

            const file =
              e.target.files[0];

            if (!file) {
              return;
            }


            // ---------------------------------------
            // Comprobar créditos
            // ---------------------------------------

            if (credits < 1) {

              alert(
                "Créditos insuficientes para iniciar el análisis IA. Redirigiendo a planes..."
              );

              window.location.href =
                "precios.html";

              return;
            }


            // ---------------------------------------
            // Descontar crédito
            // ---------------------------------------

            const {
              data: success,
              error: rpcError
            } = await supabaseClient.rpc(
              "deduct_analysis_credit"
            );


            if (rpcError || !success) {

              alert(
                "Error de validación al descontar créditos: " +
                (
                  rpcError?.message ||
                  "Inténtelo de nuevo."
                )
              );

              return;
            }


            // ---------------------------------------
            // Ir al informe
            // ---------------------------------------

            alert(
              "Análisis iniciado con éxito. Redirigiendo a tu informe de análisis..."
            );

            window.location.href =
              "informe-stl.html";

          }
        );

      }

    }


  // =================================================
  // USUARIO SIN SESIÓN
  // =================================================

  } else {

    const privatePages = [
      "analizador-stl.html",
      "informe-stl.html"
    ];


    const isPrivate =
      privatePages.some(
        page =>
          window.location.pathname.includes(page)
      );


    if (isPrivate) {

      // ---------------------------------------------
      // IMPORTANTE:
      // NO MOSTRAR ALERT.
      // Redirigir directamente al login.
      // ---------------------------------------------

      const prefix =
        window.location.pathname.includes(
          "/herramientas/"
        )
          ? ""
          : "herramientas/";


      window.location.href =
        `${prefix}login.html`;

    }

  }

}
