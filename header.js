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