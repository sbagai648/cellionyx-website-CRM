// Cellionyx Website JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cellionyx: DOM loaded, initializing...');
    
    // Initialize critical functionality first (scrolling, navigation, CTA)
    try {
        initSmoothScrolling();
        initMobileNavigation();
        initCTAModal(); // Initialize CRM integration
        console.log('✅ Critical functions initialized');
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
    }
    
    // Initialize visual enhancements with delay to prevent blocking
    setTimeout(() => {
        try {
            initScrollAnimations();
            initBackToTop();
            initFormEnhancements();
            initButtonEnhancements();
            initNavbarEffects();
            console.log('✅ Visual enhancements initialized');
        } catch (error) {
            console.error('❌ Visual enhancement error:', error);
        }
    }, 100);
    
    // Initialize heavy animations last to prevent blocking
    setTimeout(() => {
        try {
            initParticleAnimation();
            initStrandAnimation();
            console.log('✅ Animations initialized');
        } catch (error) {
            console.error('❌ Animation error:', error);
        }
    }, 500);
});

// Scroll-based animations using Intersection Observer
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Apply a staggered delay based on the element's index
                const delay = entry.target.dataset.staggerIndex ? (entry.target.dataset.staggerIndex * 150) : 0;
                
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                // Stop observing the element after it has become visible
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for fade-in animation
    const elementsToAnimate = document.querySelectorAll('.section, .hero, .use-case-card, .founder-card, .feature-card, .application-category, .protocol-card, .mission-card, .team-category, .solution-item, .evidence-stat, .timeline-phase, .pillar-card, .overview-card');
    
    elementsToAnimate.forEach((element, index) => {
        element.classList.add('fade-in-section');
        // Add a data attribute for the stagger index
        element.dataset.staggerIndex = index % 6; // Stagger up to 6 items for more dramatic effect
        observer.observe(element);
    });
}

// Enhanced particle animation for background
function initParticleAnimation() {
    // Create particles container if it doesn't exist
    let particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) {
        particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        document.body.appendChild(particlesContainer);
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    particlesContainer.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Enhanced Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.size = Math.random() * 3 + 1;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = `hsl(${200 + Math.random() * 40}, 70%, 60%)`;
            this.pulse = Math.random() * Math.PI * 2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.pulse += 0.02;
            
            // Create breathing effect
            this.currentOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.pulse));
            
            // Wrap around edges
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }
        
        draw() {
            ctx.globalAlpha = this.currentOpacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add subtle glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Draw connections to nearby particles (optimized)
        drawConnections() {
            // Reduce connection calculations for performance
            const maxConnections = 3;
            let connectionCount = 0;
            
            for (let i = 0; i < particles.length && connectionCount < maxConnections; i++) {
                const particle = particles[i];
                if (particle === this) continue;
                
                const dx = this.x - particle.x;
                const dy = this.y - particle.y;
                const distance = dx * dx + dy * dy; // Skip sqrt for performance
                
                if (distance < 14400) { // 120^2
                    ctx.globalAlpha = (14400 - distance) / 14400 * 0.05;
                    ctx.strokeStyle = '#0095D5';
                    ctx.lineWidth = 0.3;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(particle.x, particle.y);
                    ctx.stroke();
                    connectionCount++;
                }
            }
        }
    }
    
    // Initialize particles (optimized count)
    function initParticles() {
        particles = [];
        const particleCount = Math.min(25, Math.floor((canvas.width * canvas.height) / 20000)); // Reduced particle count
        
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
            particle.drawConnections();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Initialize and start animation
    resizeCanvas();
    initParticles();
    animate();
    
    // Resize handler
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });
}

// Enhanced strand animation
function initStrandAnimation() {
    // Create SVG strands that move across the screen
    const strandsContainer = document.createElement('div');
    strandsContainer.className = 'dna-strands';
    strandsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;
    document.body.appendChild(strandsContainer);
    
    // Create fewer animated strands for better performance
    for (let i = 0; i < 2; i++) {
        createStrand(strandsContainer, i);
    }
}

function createStrand(container, index) {
    const strand = document.createElement('div');
    strand.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 1200 800" style="position: absolute; top: ${index * 200}px;">
            <defs>
                <linearGradient id="strandGrad${index}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#0095D5;stop-opacity:0" />
                    <stop offset="50%" style="stop-color:#0095D5;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#00B4DB;stop-opacity:0" />
                </linearGradient>
            </defs>
            <path d="M-100,400 Q200,200 500,400 T1100,400" 
                  stroke="url(#strandGrad${index})" 
                  stroke-width="2" 
                  fill="none"
                  opacity="0.6">
                <animateTransform 
                    attributeName="transform" 
                    attributeType="XML" 
                    type="translate" 
                    values="0,0;1200,0;0,0" 
                    dur="${25 + index * 5}s" 
                    repeatCount="indefinite"/>
            </path>
            <path d="M-100,350 Q300,150 600,350 T1200,350" 
                  stroke="url(#strandGrad${index})" 
                  stroke-width="1.5" 
                  fill="none"
                  opacity="0.4">
                <animateTransform 
                    attributeName="transform" 
                    attributeType="XML" 
                    type="translate" 
                    values="0,0;-1200,0;0,0" 
                    dur="${30 + index * 3}s" 
                    repeatCount="indefinite"/>
            </path>
        </svg>
    `;
    
    container.appendChild(strand);
}

// Mobile navigation toggle
function initMobileNavigation() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-nav-menu');
    const hamburger = mobileToggle?.querySelector('.hamburger');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            hamburger?.classList.toggle('active');
        });

        // Close mobile menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                hamburger?.classList.remove('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !mobileMenu.contains(e.target) && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                hamburger?.classList.remove('active');
            }
        });
    }
}

// Back to top button functionality (unchanged)
function initBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    
    if (backToTopButton) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        // Smooth scroll to top when clicked
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Smooth scrolling for anchor links (unchanged)
function initSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#') return;
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                
                const headerOffset = 80; // Account for fixed navbar
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Form enhancements (unchanged)
function initFormEnhancements() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Add focus effects
            input.addEventListener('focus', () => {
                input.parentElement?.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.parentElement?.classList.remove('focused');
                
                // Add filled class if input has value
                if (input.value.trim() !== '') {
                    input.parentElement?.classList.add('filled');
                } else {
                    input.parentElement?.classList.remove('filled');
                }
            });
        });
        
        // Form submission handling
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Add your form submission logic here
            console.log('Form submitted');
            
            // Show success message
            showNotification('Thank you for your submission!', 'success');
        });
    });
}

// Enhanced button effects with ripple
function initButtonEnhancements() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add enhanced ripple CSS dynamically
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            .btn-primary, .btn-secondary {
                position: relative;
                overflow: hidden;
            }
            
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                pointer-events: none;
            }
            
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            /* Mobile menu hamburger animation */
            .hamburger.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .hamburger.active span:nth-child(2) {
                opacity: 0;
            }
            
            .hamburger.active span:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -6px);
            }
            
            .mobile-nav-menu.active {
                display: flex !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Enhanced navbar effects on scroll (optimized)
function initNavbarEffects() {
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        let ticking = false;
        
        function updateNavbar() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Add/remove scrolled class for styling
            if (scrollTop > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            ticking = false;
        }
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        }, { passive: true });
    }
}

// Utility function for notifications (unchanged)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add notification styles dynamically
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 2rem;
                right: 2rem;
                padding: 1rem 2rem;
                border-radius: 12px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                box-shadow: 0 8px 32px rgba(0,149,213,0.3);
                backdrop-filter: blur(10px);
            }
            
            .notification-success {
                background: rgba(16, 185, 129, 0.9);
                border: 1px solid rgba(16, 185, 129, 0.3);
            }
            
            .notification-error {
                background: rgba(239, 68, 68, 0.9);
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            
            .notification-info {
                background: rgba(0, 149, 213, 0.9);
                border: 1px solid rgba(0, 149, 213, 0.3);
            }
            
            .notification.show {
                transform: translateX(0);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Utility function for lazy loading images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        img.classList.add('lazy');
        imageObserver.observe(img);
    });
}

// Initialize lazy loading if needed
// initLazyLoading();

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobile-nav-menu');
        const hamburger = document.querySelector('.hamburger');
        
        if (mobileMenu?.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            hamburger?.classList.remove('active');
        }
    }
});

// Performance optimization: Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Remove unused scroll handler
// Optimized: All scroll handling is now done in specific functions with requestAnimationFrame 

// ===== CRM INTEGRATION =====

// Initialize CTA Modal functionality
function initCTAModal() {
    console.log('Initializing CTA modal...');
    
    // Modal is now embedded in HTML, no need to create it
    // if (!document.getElementById('ctaModal')) {
    //     createCTAModal();
    // }
    
    // Get modal elements
    const modal = document.getElementById('ctaModal');
    const closeBtn = document.querySelector('.close, .cta-modal-close');
    
    if (!modal) {
        console.error('CTA modal not found');
        return;
    }
    
    // Track current CTA type
    let currentCTAType = 'demo';
    
    // Add click handlers to all CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button, .btn-primary[data-action="demo"], .btn-primary');
    
    console.log(`Found ${ctaButtons.length} CTA buttons`);
    
    // Also handle all buttons with primary class that contain demo text
    const allPrimaryButtons = document.querySelectorAll('.btn-primary');
    allPrimaryButtons.forEach(button => {
        const buttonText = button.textContent.toLowerCase();
        if (buttonText.includes('demo') || buttonText.includes('request')) {
            console.log('Attaching handler to:', button.textContent);
            
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                currentCTAType = 'demo';
                console.log('Opening modal for:', currentCTAType);
                openCTAModal(currentCTAType);
            });
        }
    });
    
    // Global fallback for dynamically added buttons
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.btn-primary, .cta-btn, .nav-btn');
        if (target) {
            const buttonText = target.textContent.toLowerCase();
            const href = target.getAttribute('href');
            
            if (buttonText.includes('demo') || buttonText.includes('waitlist') || 
                buttonText.includes('get started') || buttonText.includes('request') ||
                (href && href.includes('demo'))) {
                
                if (!target.hasAttribute('data-cta-handled')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    target.setAttribute('data-cta-handled', 'true');
                    
                    if (buttonText.includes('waitlist')) {
                        currentCTAType = 'waitlist';
                    } else {
                        currentCTAType = 'demo';
                    }
                    
                    console.log('Fallback handler opening modal for:', currentCTAType);
                    openCTAModal(currentCTAType);
                }
            }
        }
    });
    
    // Close modal handlers
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCTAModal);
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCTAModal();
        }
    });
    
    // Handle form submission
    const form = document.getElementById('ctaForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submission started');
            
            const submitButton = form.querySelector('button[type="submit"]');
            
            // Show loading state
            showLoadingState(submitButton);
            
            try {
                // Collect form data - matching the actual form fields
                const formData = {
                    firstName: form.querySelector('#firstName')?.value?.trim() || '',
                    lastName: form.querySelector('#lastName')?.value?.trim() || '',
                    email: form.querySelector('#email')?.value?.trim() || '',
                    phone: form.querySelector('#phone')?.value?.trim() || '',
                    country: form.querySelector('#country')?.value || '',
                    state: form.querySelector('#state')?.value?.trim() || '',
                    city: form.querySelector('#city')?.value?.trim() || '',
                    userType: form.querySelector('#userType')?.value || '',
                    organization: form.querySelector('#organization')?.value?.trim() || '',
                    areaOfInterest: form.querySelector('#areaOfInterest')?.value || '',
                    intendedUse: form.querySelector('#intendedUse')?.value || '',
                    additionalInfo: form.querySelector('#additionalInfo')?.value?.trim() || '',
                    functionRole: form.querySelector('#userType')?.value || '', // Keep for backend compatibility
                    discipline: form.querySelector('#areaOfInterest')?.value || '', // Keep for backend compatibility
                    ctaType: currentCTAType || 'demo',
                    page: window.location.pathname.split('/').pop() || 'index.html',
                    consent: form.querySelector('#consent')?.checked || false
                };
                
                console.log('=== CELLIONYX FORM SUBMISSION ===');
                console.log('Submitting form data:', formData);
                console.log('Timestamp:', new Date().toISOString());
                
                // Validate required fields before submission
                if (!formData.firstName || !formData.lastName || !formData.email) {
                    console.error('Missing required fields!', {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email
                    });
                    throw new Error('Please fill in all required fields');
                }
                
                // Submit to Cellionyx CRM API
                const response = await fetch('https://us-central1-cellionyx-crm.cloudfunctions.net/api/public/submit-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                console.log('Response status:', response.status);
                
                let responseData;
                const responseText = await response.text();
                console.log('Response text:', responseText);
                
                try {
                    responseData = JSON.parse(responseText);
                } catch (parseError) {
                    console.log('Could not parse response as JSON:', parseError);
                    // If the response is not JSON but the status is OK, treat as success
                    if (response.ok) {
                        responseData = { success: true, message: 'Thank you! We\'ll be in touch shortly.' };
                    } else {
                        throw new Error('Invalid response from server');
                    }
                }
                
                if (response.ok || responseData.success) {
                    console.log('✅ Form submitted successfully');
                    console.log('Prospect ID:', responseData.prospectId);
                    console.log('Response message:', responseData.message);
                    console.log('Submitted email:', formData.email);
                    
                    // Success - Reset form first, then clear errors, then close modal
                    form.reset();
                    clearAllErrors();
                    resetSubmitButton(submitButton);
                    
                    // Close modal
                    modal.style.display = 'none';
                    
                    // Show success message
                    const successMsg = `${responseData.message || 'Thank you! We\'ll be in touch shortly.'} (Email: ${formData.email})`;
                    showCustomSuccessMessage(successMsg);
                } else {
                    throw new Error(responseData.error || responseData.message || 'Failed to submit form');
                }
            } catch (error) {
                console.error('❌ Form submission error:', error);
                
                // Show error message
                showCustomErrorMessage(error.message || 'Something went wrong. Please try again.');
                resetSubmitButton(submitButton);
            }
        });
    }
}

// Create the CTA modal HTML
function createCTAModal() {
    const modalHTML = `
        <div id="ctaModal" class="cta-modal" style="display: none;">
            <div class="cta-modal-content">
                <span class="cta-modal-close">&times;</span>
                <h2 id="ctaModalTitle">Request a Demo</h2>
                <p id="ctaModalSubtitle">See Cellionyx technology in action</p>
                <form id="ctaForm">
                    <div class="form-row">
                        <div class="form-group">
                            <input type="text" id="firstName" name="firstName" placeholder="First Name *" required>
                        </div>
                        <div class="form-group">
                            <input type="text" id="lastName" name="lastName" placeholder="Last Name *" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <input type="email" id="email" name="email" placeholder="Email Address *" required>
                    </div>
                    
                    <div class="form-group">
                        <input type="text" id="organization" name="organization" placeholder="Organization/Company">
                    </div>
                    
                    <div class="form-group phone-group" style="display: flex; gap: 10px;">
                        <select id="countryCode" name="countryCode" style="width: 120px;">
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+33">🇫🇷 +33</option>
                            <option value="+49">🇩🇪 +49</option>
                            <option value="+39">🇮🇹 +39</option>
                            <option value="+34">🇪🇸 +34</option>
                            <option value="+31">🇳🇱 +31</option>
                            <option value="+46">🇸🇪 +46</option>
                            <option value="+41">🇨🇭 +41</option>
                            <option value="+43">🇦🇹 +43</option>
                            <option value="+32">🇧🇪 +32</option>
                            <option value="+353">🇮🇪 +353</option>
                            <option value="+47">🇳🇴 +47</option>
                            <option value="+45">🇩🇰 +45</option>
                            <option value="+358">🇫🇮 +358</option>
                            <option value="+48">🇵🇱 +48</option>
                            <option value="+61">🇦🇺 +61</option>
                            <option value="+64">🇳🇿 +64</option>
                            <option value="+81">🇯🇵 +81</option>
                            <option value="+82">🇰🇷 +82</option>
                            <option value="+65">🇸🇬 +65</option>
                            <option value="+55">🇧🇷 +55</option>
                            <option value="+54">🇦🇷 +54</option>
                            <option value="+52">🇲🇽 +52</option>
                            <option value="+971">🇦🇪 +971</option>
                            <option value="+27">🇿🇦 +27</option>
                            <option value="+91">🇮🇳 +91</option>
                            <option value="+972">🇮🇱 +972</option>
                            <option value="+86">🇨🇳 +86</option>
                        </select>
                        <input type="tel" id="phone" name="phone" placeholder="Phone Number *" required style="flex: 1;">
                    </div>
                    
                    <div class="form-group">
                        <select id="function" name="function" required>
                            <option value="">Select Function *</option>
                            <option value="Healthcare Professional">Healthcare Professional</option>
                            <option value="Physical Therapist">Physical Therapist</option>
                            <option value="Sports Medicine Doctor">Sports Medicine Doctor</option>
                            <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                            <option value="General Practitioner">General Practitioner</option>
                            <option value="Chiropractor">Chiropractor</option>
                            <option value="Athletic Trainer">Athletic Trainer</option>
                            <option value="Veterinary Professional">Veterinary Professional</option>
                            <option value="Research Institution">Research Institution</option>
                            <option value="Hospital Administrator">Hospital Administrator</option>
                            <option value="Medical Practice Owner">Medical Practice Owner</option>
                            <option value="Wellness Center">Wellness Center</option>
                            <option value="Sports Team/Organization">Sports Team/Organization</option>
                            <option value="Fitness Professional">Fitness Professional</option>
                            <option value="Individual Patient">Individual Patient</option>
                            <option value="Investor">Investor/VC</option>
                            <option value="Media/Press">Media/Press</option>
                            <option value="Distributor">Distributor/Reseller</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <select id="discipline" name="discipline">
                            <option value="">Select Area of Interest</option>
                            <option value="Sports Medicine">Sports Medicine</option>
                            <option value="Orthopedics">Orthopedics</option>
                            <option value="Physical Therapy">Physical Therapy</option>
                            <option value="Pain Management">Pain Management</option>
                            <option value="Rehabilitation">Rehabilitation</option>
                            <option value="Wound Care">Wound Care</option>
                            <option value="Regenerative Medicine">Regenerative Medicine</option>
                            <option value="Athletic Performance">Athletic Performance</option>
                            <option value="Recovery & Wellness">Recovery & Wellness</option>
                            <option value="Injury Prevention">Injury Prevention</option>
                            <option value="Post-Surgical Recovery">Post-Surgical Recovery</option>
                            <option value="Chronic Pain">Chronic Pain Management</option>
                            <option value="Research">Clinical Research</option>
                            <option value="Veterinary Medicine">Veterinary Medicine</option>
                            <option value="Personal Health">Personal Health & Wellness</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <textarea id="message" name="message" placeholder="Additional comments or specific questions (optional)" rows="3" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: #fff; resize: vertical;"></textarea>
                    </div>
                    
                    <div class="consent-section" style="margin: 20px 0;">
                        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                            <input type="checkbox" id="consent" name="consent" required style="margin-top: 3px;">
                            <span>I consent to being contacted by Cellionyx regarding this demo request and understand that my information will be used in accordance with your privacy policy. *</span>
                        </label>
                    </div>
                    
                    <button type="submit" class="btn-primary submit-btn">Submit Request</button>
                </form>
            </div>
        </div>
        
        <style>
            .cta-modal {
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }
            
            .cta-modal-content {
                background: linear-gradient(135deg, #001833 0%, #000d1a 100%);
                margin: 5% auto;
                padding: 40px;
                border: 1px solid rgba(0, 201, 255, 0.3);
                border-radius: 20px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 20px 60px rgba(0, 201, 255, 0.2);
                position: relative;
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .cta-modal-close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                transition: color 0.3s;
            }
            
            .cta-modal-close:hover,
            .cta-modal-close:focus {
                color: #00C9FF;
            }
            
            .cta-modal h2 {
                color: #fff;
                margin-bottom: 10px;
                font-size: 28px;
            }
            
            .cta-modal p {
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 30px;
            }
            
            .cta-modal .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .cta-modal .form-group {
                margin-bottom: 20px;
            }
            
            .cta-modal input,
            .cta-modal select {
                width: 100%;
                padding: 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .cta-modal input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }
            
            .cta-modal input:focus,
            .cta-modal select:focus {
                outline: none;
                border-color: #00C9FF;
                background: rgba(255, 255, 255, 0.15);
            }
            
            .cta-modal .submit-btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #00C9FF 0%, #0066CC 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .cta-modal .submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(0, 201, 255, 0.3);
            }
            
            .cta-modal .submit-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            @media (max-width: 768px) {
                .cta-modal-content {
                    width: 95%;
                    margin: 10% auto;
                    padding: 30px 20px;
                }
                
                .cta-modal .form-row {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Open the CTA modal
function openCTAModal(type = 'demo') {
    const modal = document.getElementById('ctaModal');
    const title = document.getElementById('ctaModalTitle');
    const subtitle = document.getElementById('ctaModalSubtitle');
    
    if (!modal) {
        console.error('Modal not found');
        return;
    }
    
    // Update modal content based on type
    if (type === 'waitlist') {
        title.textContent = 'Join the Waiting List';
        subtitle.textContent = 'Be among the first to experience Cellionyx';
    } else {
        title.textContent = 'Request a Demo';
        subtitle.textContent = 'See Cellionyx technology in action';
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close the CTA modal
function closeCTAModal() {
    const modal = document.getElementById('ctaModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Show loading state on button
function showLoadingState(button) {
    if (button) {
        button.disabled = true;
        button.textContent = 'Submitting...';
    }
}

// Reset submit button
function resetSubmitButton(button) {
    if (button) {
        button.disabled = false;
        button.textContent = 'Submit Request';
    }
}

// Clear all form errors
function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
    document.querySelectorAll('.error').forEach(element => {
        element.classList.remove('error');
    });
}

// Show custom success message
function showCustomSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'custom-success-message';
    successDiv.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #00C9FF 0%, #0066CC 100%); 
                    color: white; padding: 20px 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,201,255,0.3); 
                    z-index: 10001; animation: slideInRight 0.3s ease;">
            <h3 style="margin: 0 0 5px 0; font-size: 18px;">✓ Success!</h3>
            <p style="margin: 0; font-size: 14px;">${message}</p>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// Show custom error message
function showCustomErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'custom-error-message';
    errorDiv.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); 
                    color: white; padding: 20px 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(255,68,68,0.3); 
                    z-index: 10001; animation: slideInRight 0.3s ease;">
            <h3 style="margin: 0 0 5px 0; font-size: 18px;">⚠ Error</h3>
            <p style="margin: 0; font-size: 14px;">${message}</p>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Add animation keyframes
if (!document.querySelector('#ctaAnimations')) {
    const style = document.createElement('style');
    style.id = 'ctaAnimations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}