document.addEventListener("DOMContentLoaded", () => {
    
    let progress = 0;
    const bar = document.getElementById("progress-bar");
    const loader = document.getElementById("loader");
    const content = document.getElementById("content");
    const navbar = document.getElementById("navbar");

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                loader.style.opacity = "0"; 
                setTimeout(() => {
                    loader.style.display = "none";
                    content.style.display = "block";
                    navbar.style.display = "block";
                    initTypewriter(); 
                    initScrollObserver();
                }, 800); 
            }, 400);
        }
        bar.style.width = progress + "%";
    }, 80);

    function initScrollObserver() {
        const sections = document.querySelectorAll('.window-section');
        const navLinks = document.querySelectorAll('.nav-links a');

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const contentInside = entry.target.querySelector('.content-reveal');
                
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + entry.target.id) {
                            link.classList.add('active');
                        }
                    });
                    if (contentInside) contentInside.classList.add('active');
                } else {
                    if (contentInside) contentInside.classList.remove('active');
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    // Actualizado con tus servicios
    const words = ["Frontend Web", "Desarrollo Móvil", "Videojuegos 2D"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function initTypewriter() {
        const span = document.getElementById("typewriter");
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            span.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            span.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let speed = isDeleting ? 30 : 80;

        if (!isDeleting && charIndex === currentWord.length) {
            speed = 2500; 
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length; 
            speed = 300; 
        }
        setTimeout(initTypewriter, speed);
    }
});