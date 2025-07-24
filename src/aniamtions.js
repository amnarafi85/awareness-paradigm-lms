// Enhanced animations and interactions for Student Dashboard
export const initializeAnimations = () => {
  // Floating particles background
  const createFloatingParticles = () => {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    particlesContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
    `;

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 2}px;
        height: ${Math.random() * 4 + 2}px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        border-radius: 50%;
        opacity: ${Math.random() * 0.5 + 0.2};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${Math.random() * 20 + 10}s infinite linear;
      `;
      particlesContainer.appendChild(particle);
    }

    document.body.appendChild(particlesContainer);
  };

  // Parallax scroll effect
  const initParallax = () => {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.parallax-element');
      
      parallaxElements.forEach((element, index) => {
        const speed = (index + 1) * 0.1;
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    });
  };

  // Interactive card hover effects
  const enhanceCardInteractions = () => {
    const cards = document.querySelectorAll('.course-card');
    
    cards.forEach(card => {
      // Mouse move effect
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
      
      // Click ripple effect
      card.addEventListener('click', (e) => {
        const ripple = document.createElement('div');
        const rect = card.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
          z-index: 10;
        `;
        
        card.style.position = 'relative';
        card.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });
  };

  // Smooth reveal animations on scroll
  const initScrollAnimations = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  };

  // Typing animation for welcome text
  const typeWriter = (element, text, speed = 100) => {
    let i = 0;
    element.innerHTML = '';
    
    const typing = () => {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(typing, speed);
      }
    };
    
    typing();
  };

  // Initialize welcome text animation
  const initWelcomeAnimation = () => {
    const welcomeElement = document.querySelector('.welcome-text');
    if (welcomeElement) {
      const originalText = welcomeElement.textContent;
      typeWriter(welcomeElement, originalText, 80);
    }
  };

  // Glitch effect for course titles
  const addGlitchEffect = () => {
    const titles = document.querySelectorAll('.course-title');
    
    titles.forEach(title => {
      title.addEventListener('mouseenter', () => {
        title.classList.add('glitch-active');
        setTimeout(() => title.classList.remove('glitch-active'), 1000);
      });
    });
  };

  // Magnetic button effect
  const initMagneticButtons = () => {
    const buttons = document.querySelectorAll('.magnetic-btn');
    
    buttons.forEach(button => {
      button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translate(0px, 0px)';
      });
    });
  };

  // Initialize all animations
  createFloatingParticles();
  initParallax();
  setTimeout(() => {
    enhanceCardInteractions();
    initScrollAnimations();
    initWelcomeAnimation();
    addGlitchEffect();
    initMagneticButtons();
  }, 100);
};

// CSS animations as string to be injected
export const animationStyles = `
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(120deg); }
    66% { transform: translateY(5px) rotate(240deg); }
    100% { transform: translateY(0px) rotate(360deg); }
  }

  @keyframes ripple {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
    50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
  }

  @keyframes glitch {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  .glitch-active {
    animation: glitch 0.3s infinite;
  }

  .glitch-active::before,
  .glitch-active::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .glitch-active::before {
    animation: glitch 0.3s infinite;
    color: #ff0000;
    z-index: -1;
  }

  .glitch-active::after {
    animation: glitch 0.3s infinite reverse;
    color: #00ffff;
    z-index: -2;
  }

  .shimmer-effect {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }

  .magnetic-btn {
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .course-card {
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transform-style: preserve-3d;
  }

  .parallax-element {
    transition: transform 0.1s ease-out;
  }
`;