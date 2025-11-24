// Global variable to hold fetched data
let siteData = null;

// --- COOKIE HELPERS ---
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. FETCH DATA
    try {
        const response = await fetch('data.json');
        siteData = await response.json();
        
        // Once data is loaded, initialize everything
        populateStaticContent();
        initializeApp();
    } catch (error) {
        console.error("Error loading site data:", error);
    }
});

function populateStaticContent() {
    // 1. Header Company Info
    const companyNameEls = document.querySelectorAll('.logo-text');
    companyNameEls.forEach(el => {
        el.innerHTML = `${siteData.company.name}`;
    });
    
    const companyLogos = document.querySelectorAll('.company-logo');
    companyLogos.forEach(img => img.src = siteData.company.logo_url);

    // 2. Games Dropdown
    const dropdown = document.querySelector('.dropdown-content');
    if (dropdown) {
        dropdown.innerHTML = ''; 
        siteData.games.forEach(game => {
            const link = document.createElement('a');
            link.href = game.link;
            link.innerText = game.title;
            dropdown.appendChild(link);
        });
    }

    // 3. Hero Section (Index Only)
    siteData.games.forEach((game, index) => {
        const panel = document.getElementById(`panel-${index + 1}`);
        if (panel) {
            panel.style.backgroundImage = `url('${game.bg_image}')`;
            // Store the link as a data attribute for the click handler logic
            panel.dataset.link = game.link;
            const logoImg = panel.querySelector('.game-logo');
            if (logoImg) {
                logoImg.src = game.logo_image;
                logoImg.alt = game.title;
            }
        }
    });

    // 4. Team Members
    const teamGrid = document.querySelector('.team-grid');
    if (teamGrid) {
        teamGrid.innerHTML = ''; 
        siteData.team_members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'member-card';
            const imgSrc = siteData.images.team[member.img_key];
            
            card.innerHTML = `
                <img src="${imgSrc}" alt="${member.name}">
                <div class="member-info">
                    <h3>${member.name}</h3>
                    <p data-i18n="${member.role_key}"></p>
                </div>
            `;
            teamGrid.appendChild(card);
        });
    }

    // 5. Contact/Footer Email
    const contactEmail = document.querySelector('div.contact-wrapper p.email');
    if(contactEmail) contactEmail.innerText = `${siteData.company.email_press}`;
    const footerEmail = document.querySelector('footer p.email');
    if(footerEmail) footerEmail.innerText = siteData.company.email_press;
    
    const copyright = document.querySelector('.copyright');
    if(copyright) {
        copyright.innerText = `© ${siteData.company.copyright_year} ${siteData.company.name}.`;
    }

    // 7. Socials Links
    if (siteData.links && siteData.links.socials) {
        const discordLinks = document.querySelectorAll('a.discord_link');
        discordLinks.forEach(link => link.href = siteData.links.socials.discord);
        const steamLinks = document.querySelectorAll('a.steam.link');
        steamLinks.forEach(link => link.href = siteData.links.socials.steam);
        const youtubeLinks = document.querySelectorAll('a.youtube_link');
        youtubeLinks.forEach(link => link.href = siteData.links.socials.youtube);
        const instagramLinks = document.querySelectorAll('a.instagram_link');
        instagramLinks.forEach(link => link.href = siteData.links.socials.instagram);
    }
    
    // 8. Game Page Specifics
    const heroBg = document.querySelector('.game-hero-bg');
    if (heroBg) {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);
        const game = siteData.games.find(g => g.link === filename);
        if (game) {
            heroBg.style.backgroundImage = `url('${game.bg_image}')`;
            const titleEl = document.querySelector('.game-title-wrapper h1');
            if(titleEl) titleEl.innerText = game.title;
        }
    }
}

function initializeApp() {
    // --- LANGUAGE SETUP ---
    const langSelect = document.getElementById('lang-select');
    let currentLang = getCookie('nexus_lang');
    if (!currentLang) {
        const browserLang = navigator.language || navigator.userLanguage;
        currentLang = browserLang.split('-')[0];
    }
    if (!siteData.translations[currentLang]) currentLang = 'en';

    if (langSelect) langSelect.value = currentLang;
    updateLanguage(currentLang);

    // --- ANIMATION SETUP ---
    const animCheck = document.getElementById('anim-check');
    const animCookie = getCookie('nexus_anim');
    let animEnabled = true; 
    if (animCookie !== null) animEnabled = (animCookie === 'true');
    if (animCheck) animCheck.checked = animEnabled;
    toggleAnimations(animEnabled);

    // --- EVENT LISTENERS ---
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            const newLang = e.target.value;
            setCookie('nexus_lang', newLang, 365);
            updateLanguage(newLang);
        });
    }

    if (animCheck) {
        animCheck.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            setCookie('nexus_anim', isChecked, 365);
            toggleAnimations(isChecked);
        });
    }

    const clearBtn = document.getElementById('clearCookies');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            eraseCookie('nexus_lang');
            eraseCookie('nexus_anim');
            alert('Cookies cleared! Reloading...');
            location.reload();
        });
    }

    // Settings Popup (Desktop)
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPopup = document.getElementById('settingsPopup');

    if(settingsBtn && settingsPopup) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPopup.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!settingsPopup.contains(e.target) && e.target !== settingsBtn) {
                settingsPopup.classList.remove('active');
            }
        });
    }

    // --- HAMBURGER MENU LOGIC ---
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navElements = document.getElementById('navElements');
    
    if (hamburgerBtn && navElements) {
        hamburgerBtn.addEventListener('click', () => {
            navElements.classList.toggle('active');
        });
    }

    // --- MOBILE NAV DROPDOWN CLICK LOGIC ---
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    if (dropdownTrigger) {
        dropdownTrigger.addEventListener('click', (e) => {
            // Only on mobile (simple check width)
            if (window.innerWidth <= 768) {
                e.stopPropagation();
                const content = dropdownTrigger.querySelector('.dropdown-content');
                content.classList.toggle('show');
            }
        });
    }

    // Header Scroll Logic (Hide/Show)
    const navbar = document.getElementById('navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > 50 && currentScrollY > lastScrollY) {
            navbar.classList.add('hidden');
            if(navElements) navElements.classList.remove('active');
        } else if (currentScrollY < 10) {
            navbar.classList.remove('hidden');
        }
        lastScrollY = currentScrollY;
    });

    document.addEventListener('mousemove', (e) => {
        if (navbar.classList.contains('hidden') && e.clientY < 80) {
            navbar.classList.remove('hidden');
        }
    });

    // --- MOBILE HERO CAROUSEL ---
    initVerticalCarousel();

    // Scroll Animations (Observer)
    if (animEnabled) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const fadeElements = document.querySelectorAll('.text-box, .stat-box, .game-description, .member-card, .contact-wrapper');
        fadeElements.forEach(el => {
            el.style.opacity = "0";
            el.style.transform = "translateY(20px)";
            el.style.transition = "all 0.6s ease-out";
            observer.observe(el);
        });
    } else {
        document.querySelectorAll('.text-box, .stat-box, .game-description, .member-card, .contact-wrapper').forEach(el => {
            el.style.opacity = "1";
            el.style.transform = "none";
        });
    }
}

// --- VERTICAL CAROUSEL LOGIC ---
function initVerticalCarousel() {
    const panels = Array.from(document.querySelectorAll('.game-panel'));
    if (panels.length === 0) return;

    // Configuration
    const focusedIndex = 1; // 0-based index. 1 means the 2nd panel is focused.
    let carouselInterval;
    let currentShift = 0; // Tracks rotation

    // Update layout based on current shift
    function updateCarousel() {
        // Only run logic on mobile
        if (window.innerWidth > 768) {
            // Reset styles for desktop
            panels.forEach(p => {
                p.style.top = '';
                p.style.height = '';
                p.classList.remove('mobile-active');
            });
            return;
        }

        const total = panels.length;
        
        panels.forEach((panel, index) => {
            // Calculate where this panel sits in the visual order
            // (index + shift) % total handles the rotation
            let visualIndex = (index + currentShift) % total;
            if (visualIndex < 0) visualIndex += total;

            // Remove focus class
            panel.classList.remove('mobile-active');

            // Logic for Top, Height, and Focus
            if (visualIndex === focusedIndex) {
                // Focused Panel
                panel.style.top = '25%'; // Starts 25% down
                panel.style.height = '50%'; // Takes up 50% space
                panel.style.zIndex = 10;
                panel.classList.add('mobile-active');
            } else if (visualIndex < focusedIndex) {
                // Panels Above
                panel.style.top = '0%';
                panel.style.height = '25%';
                panel.style.zIndex = 1;
            } else {
                // Panels Below
                panel.style.top = '75%';
                panel.style.height = '25%';
                panel.style.zIndex = 1;
            }
        });
    }

    // Auto Rotate
    function startRotation() {
        carouselInterval = setInterval(() => {
            currentShift++; 
            updateCarousel();
        }, 4000); // Rotate every 4 seconds
    }

    function stopRotation() {
        clearInterval(carouselInterval);
    }

    // Initial Render
    updateCarousel();
    startRotation();

    // Handle Resize
    window.addEventListener('resize', updateCarousel);

    // Handle Clicks
    panels.forEach((panel, index) => {
        panel.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return; // Let standard link behavior work on desktop

            e.preventDefault(); // Stop immediate link navigation
            stopRotation(); // Stop auto rotation on interaction

            const total = panels.length;
            let visualIndex = (index + currentShift) % total;
            if (visualIndex < 0) visualIndex += total;

            if (visualIndex === focusedIndex) {
                // It was already focused, go to link
                window.location.href = panel.dataset.link;
            } else {
                // It was contracted, rotate it into focus
                // Calculate how much we need to shift to make this index === focusedIndex
                // Diff = focusedIndex - visualIndex
                const diff = focusedIndex - visualIndex;
                currentShift += diff;
                updateCarousel();
                
                // Restart rotation after a delay? Or keep it stopped?
                // Let's restart after 6 seconds of inactivity
                setTimeout(() => {
                    stopRotation(); 
                    startRotation();
                }, 6000);
            }
        });
    });
}

function updateLanguage(lang) {
    if (!siteData || !siteData.translations) return;
    
    const data = siteData.translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) {
            el.innerText = data[key];
        }
    });
}

function toggleAnimations(enabled) {
    if (!enabled) {
        document.body.classList.add('no-anim');
    } else {
        document.body.classList.remove('no-anim');
    }
}