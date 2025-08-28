document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:8000';
    const token = localStorage.getItem('accessToken');
    const username = localStorage.getItem('username');

    // --- UI Update Logic (for pages like Test1.html) ---
    const navActions = document.getElementById('nav-actions');
    if (navActions) {
        if (token && username) {
            navActions.innerHTML = `
                <span class="text-sm font-medium text-gray-700">Welcome, ${username}!</span>
                <a href="builder.html" class="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white" style="background-color: #FF7A00;">My Builder</a>
                <button id="logoutBtn" class="ml-2 text-sm text-gray-600 hover:text-blue-600">Logout</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('username');
                window.location.href = 'Test1.html';
            });
        } else {
            navActions.innerHTML = `
                <a href="login.html" class="text-sm font-medium text-gray-600 hover:text-blue-600">Login</a>
                <a href="signup.html" class="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white" style="background-color:#001AFF;">
                    Sign Up Free
                </a>
            `;
        }
    }

    // --- Form Handling Logic (for login.html and signup.html) ---
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorToast = document.getElementById('error-toast');

    const handleAuth = async (endpoint, payload) => {
        try {
            // FIXED: Sending data as JSON
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });
            
            const data = await response.json();

            if (!response.ok) {
                // FIXED: Properly reading the error detail from the server
                throw new Error(data.detail || 'An unknown error occurred.');
            }
            return data;
        } catch (error) {
            errorToast.textContent = error.message;
            errorToast.classList.remove('hidden');
            return null;
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            // FIXED: Converting FormData to a plain object for JSON conversion
            const payload = Object.fromEntries(formData.entries());
            const data = await handleAuth('token', payload);
            if (data && data.access_token) {
                localStorage.setItem('accessToken', data.access_token);
                localStorage.setItem('username', payload.username);
                window.location.href = 'Test1.html';
            }
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(signupForm);
            // FIXED: Converting FormData to a plain object for JSON conversion
            const payload = Object.fromEntries(formData.entries());
            const data = await handleAuth('signup', payload);
            if (data && data.username) {
                // Automatically log in the user after successful signup
                const loginData = await handleAuth('token', payload);
                 if (loginData && loginData.access_token) {
                    localStorage.setItem('accessToken', loginData.access_token);
                    localStorage.setItem('username', payload.username);
                    window.location.href = 'Test1.html';
                }
            }
        });
    }
});