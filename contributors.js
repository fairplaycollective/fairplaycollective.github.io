// contributors.js - Modal functionality and dynamic contributor loading

// Contributors Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const contributorsModal = document.getElementById('contributorsModal');
    const contributorsBtn = document.getElementById('contributorsBtn');
    const closeModal = document.getElementById('closeModal');

    // Only run if modal elements exist on the page
    if (!contributorsModal || !contributorsBtn || !closeModal) {
        return;
    }

    // Load contributors from JSON file
    loadContributors();

    contributorsBtn.addEventListener('click', function() {
        contributorsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });

    closeModal.addEventListener('click', function() {
        contributorsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === contributorsModal) {
            contributorsModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && contributorsModal.style.display === 'block') {
            contributorsModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});

// Load contributors from JSON file
function loadContributors() {
    fetch('contributors.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load contributors');
            }
            return response.json();
        })
        .then(data => {
            populateContributors(data.contributors);
        })
        .catch(error => {
            console.error('Error loading contributors:', error);
            // Fallback: keep the HTML hardcoded names if JSON fails
        });
}

// Populate the contributors list
function populateContributors(contributors) {
    const container = document.querySelector('.contributors-list');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add each contributor
    contributors.forEach(name => {
        const div = document.createElement('div');
        div.className = 'contributor-item';
        div.textContent = name;
        container.appendChild(div);
    });
}