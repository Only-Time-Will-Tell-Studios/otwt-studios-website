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
        dropdown.innerHTML = ''; // Clear placeholders
        siteData.games.forEach(game => {
            const link = document.createElement('a');
            link.href = game.link;
            link.innerText = game.title;
            dropdown.appendChild(link);
        });
    }

    // 3. Hero Section (Index Only) - Backgrounds and Logos
    siteData.games.forEach((game, index) => {
        // Panel ID is assumed to be panel-1, panel-2 etc matching array order
        const panel = document.getElementById(`panel-${index + 1}`);
        if (panel) {
            // Set background via JS so URL is in JSON
            panel.style.backgroundImage = `url('${game.bg_image}')`;
            
            // Set Logo Image in the panel content
            const logoImg = panel.querySelector('.game-logo');
            if (logoImg) {
                logoImg.src = game.logo_image;
                logoImg.alt = game.title;
            }
        }
    });

    // 4. Team Members (About Page)
    const teamGrid = document.querySelector('.team-grid');
    if (teamGrid) {
        teamGrid.innerHTML = ''; // Clear
        siteData.team_members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'member-card';
            // Image URL from images object based on key
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

    // 5. Contact Page Email
    const contactEmail = document.querySelector('div.contact-wrapper p.email');
    if(contactEmail) contactEmail.innerText = `${siteData.company.email_press}`;

    // 6. Footer
    const footerEmail = document.querySelector('footer p.email'); // Simple selector
    if(footerEmail) footerEmail.innerText = siteData.company.email_press;
    
    const copyright = document.querySelector('.copyright');
    if(copyright) {
        copyright.innerText = `© ${siteData.company.copyright_year} ${siteData.company.name}.`;
    }

    // 7. Socials Links (Footer and Contact)
    const discordLinks = document.querySelectorAll('a.discord_link');
    discordLinks.forEach(link => {
        link.href = siteData.links.socials.discord;
    });
    const steamLinks = document.querySelectorAll('a.steam.link');
    steamLinks.forEach(link => {
        link.href = siteData.links.socials.steam;
    });
    const youtubeLinks = document.querySelectorAll('a.youtube_link');
    youtubeLinks.forEach(link => {
        link.href = siteData.links.socials.youtube;
    });
    const instagramLinks = document.querySelectorAll('a.instagram_link');
    instagramLinks.forEach(link => {
        link.href = siteData.links.socials.instagram;
    });
    
    // 8. Game Page Specifics (If on a game page)
    const heroBg = document.querySelector('.game-hero-bg');
    if (heroBg) {
        // Find which game this is based on URL or specific ID on body/element
        // Simple check: compare current filename to JSON links
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);
        
        const game = siteData.games.find(g => g.link === filename);
        if (game) {
            heroBg.style.backgroundImage = `url('${game.bg_image}')`;
            // Update title if it's generic in HTML
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
    
    // Check against fetched translations
    if (!siteData.translations[currentLang]) currentLang = 'en';

    if (langSelect) langSelect.value = currentLang;
    updateLanguage(currentLang);

    // --- ANIMATION SETUP ---
    const animCheck = document.getElementById('anim-check');
    const animCookie = getCookie('nexus_anim');
    let animEnabled = true; 

    if (animCookie !== null) {
        animEnabled = (animCookie === 'true');
    }

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

    // Settings Popup Logic
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

    // Header Scroll Logic
    const navbar = document.getElementById('navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > 50 && currentScrollY > lastScrollY) {
            navbar.classList.add('hidden');
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

    // Scroll Animations
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