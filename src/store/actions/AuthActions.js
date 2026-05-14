import {
    formatError,
    login,
    logoutCurrentSession,
    saveTokenInLocalStorage,
    signUp,
} from '../../services/AuthService';


export const SIGNUP_CONFIRMED_ACTION = '[signup action] confirmed signup';  
export const SIGNUP_FAILED_ACTION = '[signup action] failed signup';
export const LOGIN_CONFIRMED_ACTION = '[login action] confirmed login';
export const LOGIN_FAILED_ACTION = '[login action] failed login';
export const LOADING_TOGGLE_ACTION = '[Loading action] toggle loading';
export const LOGOUT_ACTION = '[Logout action] logout action';
export const NAVTOGGLE = 'NAVTOGGLE';



export function signupAction(email, password, navigate) {
	
    return async (dispatch) => {
        signUp(email, password)
        .then((response) => {
            saveTokenInLocalStorage(response.data);
            dispatch(confirmedSignupAction(response.data));
            navigate('/');
        })
        .catch((error) => {
            const errorMessage = formatError(error);
            dispatch(signupFailedAction(errorMessage));
        });
    };
}

export function Logout(navigate) {
	return async (dispatch) => {
        await logoutCurrentSession();
        navigate('/login');

        dispatch({
            type: LOGOUT_ACTION,
        });
    };
}

export function loginAction(email, password, navigate) {
    return async (dispatch) => {
         login(email, password)
            .then((response) => { 
                saveTokenInLocalStorage(response.data);
               dispatch(loginConfirmedAction(response.data));			              
				navigate('/');                
            })
            .catch((error) => {				
                const errorMessage = formatError(error);
                dispatch(loginFailedAction(errorMessage));
            });
    };
}

export function loginFailedAction(data) {
    return {
        type: LOGIN_FAILED_ACTION,
        payload: data,
    };
}

export function loginConfirmedAction(data) {
    return {
        type: LOGIN_CONFIRMED_ACTION,
        payload: data,
    };
}

export function confirmedSignupAction(payload) {
    return {
        type: SIGNUP_CONFIRMED_ACTION,
        payload,
    };
}

export function signupFailedAction(message) {
    return {
        type: SIGNUP_FAILED_ACTION,
        payload: message,
    };
}

export function loadingToggleAction(status) {
    return {
        type: LOADING_TOGGLE_ACTION,
        payload: status,
    };
}
export const navtoggle = () => {    
    return {        
      type: 'NAVTOGGLE',
    };
};
