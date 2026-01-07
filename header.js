// Function to update the header based on login status
function updateHeaderUI() {
    const signInLink = document.querySelector('.sign-in-link');
    const userName = localStorage.getItem('userName');
    const authToken = localStorage.getItem('authToken');

    if (authToken && userName) {
        // --- User is logged in ---
        
        // 1. Change the sign-in link to display "Hello [Name]"
        signInLink.href = '#'; // Change URL to prevent accidental navigation
        signInLink.innerHTML = `<span class="icon-placeholder">👋</span> Hello ${userName}`;

        // 2. Create and insert the "Sign Out" button
        const signOutButton = document.createElement('a');
        signOutButton.href = '#';
        signOutButton.className = 'sign-out-link';
        signOutButton.innerHTML = `<span class="icon-placeholder">➡️</span> Sign Out`;
        
        // Add the click handler to log the user out
        signOutButton.addEventListener('click', handleSignOut);
        
        // Insert the Sign Out button next to the Hello link
        const utilityIconsDiv = document.querySelector('.utility-icons');
        
        // Check if Sign Out button already exists before appending (to prevent duplication)
        if (!document.querySelector('.sign-out-link')) {
            utilityIconsDiv.insertBefore(signOutButton, signInLink.nextSibling);
        }

    } else {
        // --- User is logged out ---
        // Ensure it shows the default Sign In state
        signInLink.href = 'signin.html';
        signInLink.innerHTML = `<span class="icon-placeholder">👤</span> Sign in`;
        
        // Remove the Sign Out link if it exists
        const existingSignOut = document.querySelector('.sign-out-link');
        if (existingSignOut) {
            existingSignOut.remove();
        }
    }
}

// Function to handle the sign-out process
function handleSignOut(e) {
    e.preventDefault();
    
    // 1. Clear all authentication data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');

    // 2. Update the header immediately
    updateHeaderUI(); 

    // 3. Redirect to the home page (or sign-in page)
    window.location.href = 'index.html'; 
}

// Execute the function when the page loads
document.addEventListener('DOMContentLoaded', updateHeaderUI);

