// ============================================================
// PRINTLAB — AUTH HELPER
// ============================================================

// CONFIGURACIÓN DE SUPABASE

const SUPABASE_URL =
    "https://jmwprzgfdkphbxryjbnr.supabase.co";

const SUPABASE_ANON_KEY =
    "PEGA_AQUI_TU_PUBLISHABLE_O_ANON_KEY";


/* ============================================================
   CLIENTE SUPABASE
   ============================================================ */

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* ============================================================
   OBTENER USUARIO ACTUAL
   ============================================================ */

async function getCurrentUser() {

    try {

        const {
            data: {
                user
            },
            error
        } = await supabaseClient.auth.getUser();


        if (error) {

            console.error(
                "Error obteniendo usuario:",
                error
            );

            return null;
        }


        return user || null;


    } catch (error) {

        console.error(
            "Error de conexión con Supabase:",
            error
        );

        return null;
    }
}


/* ============================================================
   CERRAR SESIÓN
   ============================================================ */

async function signOutUser() {

    try {

        const {
            error
        } = await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                "Error cerrando sesión:",
                error
            );

            return false;
        }


        window.location.href =
            "../index.html";


        return true;


    } catch (error) {

        console.error(
            "Error inesperado cerrando sesión:",
            error
        );

        return false;
    }
}


/* ============================================================
   COMPROBAR SI HAY SESIÓN
   ============================================================ */

async function isUserLoggedIn() {

    const user =
        await getCurrentUser();

    return user !== null;
}


/* ============================================================
   PROTEGER PÁGINAS
   ============================================================ */

async function requireAuth() {

    const user =
        await getCurrentUser();


    if (!user) {

        window.location.href =
            "../herramientas/login.html";

        return null;
    }


    return user;
}


/* ============================================================
   OBTENER PERFIL DEL USUARIO
   ============================================================ */

async function getUserProfile() {

    const user =
        await getCurrentUser();


    if (!user) {
        return null;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();


        if (error) {

            console.error(
                "Error obteniendo perfil:",
                error
            );

            return null;
        }


        return data;


    } catch (error) {

        console.error(
            "Error inesperado obteniendo perfil:",
            error
        );

        return null;
    }
}


/* ============================================================
   OBTENER CRÉDITOS DEL USUARIO
   ============================================================ */

async function getUserCredits() {

    const profile =
        await getUserProfile();


    if (!profile) {
        return 0;
    }


    return profile.credits || 0;
}


/* ============================================================
   ACTUALIZAR CRÉDITOS
   ============================================================ */

async function updateUserCredits(
    amount
) {

    const user =
        await getCurrentUser();


    if (!user) {

        console.error(
            "No hay usuario autenticado."
        );

        return false;
    }


    try {

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();


        if (profileError) {

            console.error(
                "Error obteniendo créditos:",
                profileError
            );

            return false;
        }


        const currentCredits =
            profile?.credits || 0;


        const newCredits =
            currentCredits + amount;


        const {
            error
        } = await supabaseClient
            .from("profiles")
            .update({
                credits: newCredits
            })
            .eq("id", user.id);


        if (error) {

            console.error(
                "Error actualizando créditos:",
                error
            );

            return false;
        }


        return true;


    } catch (error) {

        console.error(
            "Error inesperado actualizando créditos:",
            error
        );

        return false;
    }
}


/* ============================================================
   RESTAR UN CRÉDITO
   ============================================================ */

async function useCredit() {

    const credits =
        await getUserCredits();


    if (credits <= 0) {

        console.warn(
            "El usuario no tiene créditos suficientes."
        );

        return false;
    }


    return await updateUserCredits(-1);
}


/* ============================================================
   ESCUCHAR CAMBIOS DE AUTENTICACIÓN
   ============================================================ */

supabaseClient.auth.onAuthStateChange(
    function (
        event,
        session
    ) {

        console.log(
            "Estado de autenticación:",
            event
        );

    }
);
