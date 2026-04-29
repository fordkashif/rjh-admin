import swal from "sweetalert";
import {
    loginConfirmedAction,
    LOGOUT_ACTION,
} from '../store/actions/AuthActions';
import { isSupabaseConfigured, supabase } from "./supabaseClient";

function buildAuthPayload(session) {
    const user = session?.user ?? {};
    const accessToken = session?.access_token ?? '';
    const refreshToken = session?.refresh_token ?? '';
    const expiresIn = Number(session?.expires_in ?? 0);
    const expiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null;

    return {
        email: user.email ?? '',
        idToken: accessToken,
        localId: user.id ?? '',
        expiresIn: expiresIn ? String(expiresIn) : '',
        refreshToken,
        expireDate: expiresAt ? expiresAt.toISOString() : '',
        user,
    };
}

function createConfigError() {
    return new Error("Sign-in is not available yet. Please check the admin connection settings.");
}

export function signUp(email, password) {
    if (!isSupabaseConfigured || !supabase) {
        return Promise.reject(createConfigError());
    }

    return supabase.auth.signUp({
        email,
        password,
    }).then(({ data, error }) => {
        if (error) {
            throw error;
        }

        return { data: buildAuthPayload(data.session) };
    });
}

export function login(email, password) {
    if (!isSupabaseConfigured || !supabase) {
        return Promise.reject(createConfigError());
    }

    return supabase.auth.signInWithPassword({
        email,
        password,
    }).then(({ data, error }) => {
        if (error) {
            throw error;
        }

        return { data: buildAuthPayload(data.session) };
    });
}

export function formatError(errorResponse) {
    const normalizedMessage = String(
        errorResponse?.message ??
        errorResponse?.error_description ??
        errorResponse?.error?.message ??
        errorResponse ??
        "Authentication failed.",
    ).toLowerCase();

    if (normalizedMessage.includes("invalid login credentials")) {
        swal("Oops", "Invalid email or password", "error", { button: "Try Again!" });
        return "Invalid email or password";
    }

    if (normalizedMessage.includes("email not confirmed")) {
        swal("Oops", "Please confirm this email address before signing in", "error", { button: "OK" });
        return "Please confirm this email address before signing in.";
    }

    if (normalizedMessage.includes("user already registered")) {
        swal("Oops", "This email is already registered", "error");
        return "This email is already registered.";
    }

    if (normalizedMessage.includes("not configured")) {
        swal("Oops", "Sign-in is not available yet. Please check the admin connection settings.", "error");
        return "Sign-in is not available yet. Please check the admin connection settings.";
    }

    const message = errorResponse?.message ?? "Authentication failed.";
    swal("Oops", message, "error", { button: "Try Again!" });
    return message;
}

export function saveTokenInLocalStorage(tokenDetails) {
    localStorage.setItem('userDetails', JSON.stringify(tokenDetails));
}

export function runLogoutTimer(dispatch, timer, navigate) {
    return { dispatch, timer, navigate };
}

export async function logoutCurrentSession() {
    if (!isSupabaseConfigured || !supabase) {
        localStorage.removeItem('userDetails');
        return;
    }

    await supabase.auth.signOut();
    localStorage.removeItem('userDetails');
}

export async function checkAutoLogin(dispatch, navigate) {
    if (!isSupabaseConfigured || !supabase) {
        dispatch({
            type: LOGOUT_ACTION,
        });
        navigate('/login');
        return;
    }

    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
        localStorage.removeItem('userDetails');
        dispatch({
            type: LOGOUT_ACTION,
        });
        navigate('/login');
        return;
    }

    const tokenDetails = buildAuthPayload(data.session);
    saveTokenInLocalStorage(tokenDetails);
    dispatch(loginConfirmedAction(tokenDetails));
}
