// Function to refresh the cart number display
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countElements = document.querySelectorAll('.cart-count');
    
    // Calculate total items (sum of quantities or just number of unique products)
    const totalItems = cart.length; 

    countElements.forEach(el => {
        el.textContent = totalItems;
        // Hide the badge if the cart is empty for a cleaner look
        el.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
}

// Run this automatically when any page loads
document.addEventListener('DOMContentLoaded', updateCartCount);


document.addEventListener('DOMContentLoaded', () => {
    // 1. Find the element where links should go (Make sure your HTML has <div id="nav-auth"></div>)
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');

    if (token && userName) {
        // User is logged in: Show "Hello John" and "Sign Out"
        navAuth.innerHTML = `
            <span style="margin-right: 15px; color: #5d2595; font-weight: bold;">Hello, ${userName} 👋</span>
            <a href="#" id="logoutBtn" class="nav-link" style="color: red; text-decoration: none;">Sign Out</a>
        `;

        // Handle Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('cart'); // Optional: clear cart on logout
            window.location.href = 'signin.html';
        });
    } else {
        // User is logged out: Show Login/Register
        navAuth.innerHTML = `
            <a href="signin.html" class="nav-link">Sign In</a>
            <a href="signup.html" class="nav-link">Sign Up</a>
        `;
    }
});