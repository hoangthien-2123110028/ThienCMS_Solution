// ============================================================
// NAMCMS CYBERPUNK - Site JavaScript
// Sidebar toggle, active nav, page transitions
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    // --- Sidebar Toggle ---
    const sidebar = document.getElementById('cyberSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        });

        overlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // --- Active Nav Item ---
    const currentPath = window.location.pathname.toLowerCase();
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

    navItems.forEach(function (item) {
        const href = item.getAttribute('href');
        if (!href) return;

        const hrefPath = href.toLowerCase();

        // Exact match or starts-with for sub-pages
        if (currentPath === hrefPath ||
            (hrefPath !== '/' && currentPath.startsWith(hrefPath))) {
            item.classList.add('active');
        }
    });

    // If no item is active and we're on root, activate Home
    const anyActive = document.querySelector('.sidebar-nav .nav-item.active');
    if (!anyActive && (currentPath === '/' || currentPath === '')) {
        const homeItem = document.querySelector('.sidebar-nav .nav-item[href="/"]');
        if (homeItem) homeItem.classList.add('active');
    }

    // --- Animate content on load ---
    const content = document.querySelector('.cyber-content');
    if (content) {
        content.classList.add('animate-fade-in');
    }

    // --- Ripple effect on cyber buttons ---
    document.querySelectorAll('.btn-cyber').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            // Allow link navigation - just add visual feedback
            const rect = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                width: 0; height: 0;
                left: ${e.clientX - rect.left}px;
                top: ${e.clientY - rect.top}px;
                transform: translate(-50%, -50%);
                animation: ripple-out 0.6s ease-out forwards;
            `;
            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple keyframes
    if (!document.getElementById('rippleStyle')) {
        const style = document.createElement('style');
        style.id = 'rippleStyle';
        style.textContent = `
            @keyframes ripple-out {
                to { width: 300px; height: 300px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});
