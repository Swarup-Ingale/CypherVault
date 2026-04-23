class Typewriter {
    constructor(element, texts, typingSpeed = 50, deletingSpeed = 30, pauseDuration = 2000) {
        this.element = element;
        this.texts = texts;
        this.typingSpeed = typingSpeed;
        this.deletingSpeed = deletingSpeed;
        this.pauseDuration = pauseDuration;
        
        this.textIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        
        this.type();
    }
    
    type() {
        const currentText = this.texts[this.textIndex];
        
        if (this.isDeleting) {
            this.element.innerText = currentText.substring(0, this.charIndex - 1);
            this.charIndex--;
        } else {
            this.element.innerText = currentText.substring(0, this.charIndex + 1);
            this.charIndex++;
        }
        
        let typeSpeed = this.isDeleting ? this.deletingSpeed : this.typingSpeed;
        
        if (!this.isDeleting && this.charIndex === currentText.length) {
            typeSpeed = this.pauseDuration;
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIndex === 0) {
            this.isDeleting = false;
            this.textIndex = (this.textIndex + 1) % this.texts.length;
            typeSpeed = 500;
        }
        setTimeout(() => this.type(), typeSpeed);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const target = document.getElementById('typewriter-text');
    if (target) {
        const phrases = [
            "Advanced Target Profiling.",
            "Vulnerability Demonstration Sandbox.",
            "Testing Dual-State Architecture.",
            "Enterprise-Grade Defense Systems."
        ];
        new Typewriter(target, phrases);
    }
});