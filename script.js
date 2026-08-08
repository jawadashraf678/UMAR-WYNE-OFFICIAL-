document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Header Scroll Effect
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            header.style.background = 'rgba(10, 11, 16, 0.95)';
            header.style.padding = '14px 0';
            header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        } else {
            header.style.background = 'rgba(10, 11, 16, 0.6)';
            header.style.padding = '24px 0';
            header.style.boxShadow = 'none';
        }
    });

    // 2. Smooth Scroll for CTA buttons
    const ctaLinks = document.querySelectorAll('a[href^="#"]');
    ctaLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        });
    });

    // 3. Multi-Step Form Logic
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const nextButtons = document.querySelectorAll('[data-next]');
    const backButtons = document.querySelectorAll('[data-back]');
    const stepItems = document.querySelectorAll('.tracker-step-item');
    const progressFill = document.getElementById('progress-fill');
    let currentStep = 1;

    function updateStepIndicator() {
        stepItems.forEach((item, index) => {
            const stepNum = index + 1;
            if (stepNum < currentStep) {
                item.classList.add('completed');
                item.classList.remove('active');
            } else if (stepNum === currentStep) {
                item.classList.add('active');
                item.classList.remove('completed');
            } else {
                item.classList.remove('active', 'completed');
            }
        });
        
        // Progress fill: Step 1 (0%), Step 2 (50%), Step 3 (100%)
        const fillPercent = ((currentStep - 1) / (steps.length - 1)) * 100;
        if (progressFill) {
            progressFill.style.width = `${fillPercent}%`;
        }
    }

    function showStep(stepNum) {
        steps.forEach(step => {
            if (parseInt(step.dataset.step) === stepNum) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        currentStep = stepNum;
        updateStepIndicator();
    }

    // Live Character Count Tracker for Project Details Textarea
    const detailsTextarea = document.getElementById('textarea-details');
    const charCountNum = document.getElementById('char-count-num');
    const charCountBadge = document.getElementById('char-count-badge');
    const charCountError = document.getElementById('char-count-error');

    if (detailsTextarea) {
        detailsTextarea.addEventListener('input', () => {
            const count = detailsTextarea.value.trim().length;
            if (charCountNum) charCountNum.textContent = count;
            
            if (count >= 20) {
                if (charCountBadge) charCountBadge.style.color = '#10b981';
                if (charCountError) charCountError.style.display = 'none';
                detailsTextarea.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            } else {
                if (charCountBadge) charCountBadge.style.color = '#94a3b8';
            }
        });
    }

    function validateCurrentStep() {
        const activeStep = document.querySelector('.form-step.active');
        if (!activeStep) return true;
        
        const inputs = Array.from(activeStep.querySelectorAll('input, select, textarea'));
        let isValid = true;
        
        // Validate each input in the active step using standard HTML5 validation
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            if (!input.checkValidity()) {
                input.reportValidity(); // Show native browser warning tooltip
                isValid = false;
                break; // Stop at first invalid input to focus on it
            }
        }
        
        // Extra validation for 20-character minimum requirement on textarea in step 3
        if (isValid && detailsTextarea && activeStep.contains(detailsTextarea)) {
            const charCount = detailsTextarea.value.trim().length;
            if (charCount < 20) {
                if (charCountError) {
                    charCountError.style.display = 'block';
                    charCountError.textContent = `Please enter at least 20 characters so we can understand your project requirements (currently ${charCount} character${charCount === 1 ? '' : 's'}).`;
                }
                if (charCountBadge) charCountBadge.style.color = '#ef4444';
                detailsTextarea.style.borderColor = '#ef4444';
                detailsTextarea.focus();
                isValid = false;
            }
        }
        
        return isValid;
    }

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateCurrentStep()) {
                showStep(currentStep + 1);
            }
        });
    });

    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showStep(currentStep - 1);
        });
    });

    // Initialize progress bar
    updateStepIndicator();

    // 4. Form Submission handling with webhook delivery (Final Step)
    const form = document.getElementById('assessment-form');
    const submitBtn = document.getElementById('btn-submit-form');
    
    if (form && submitBtn) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Double check validation of step 3 fields
            if (!validateCurrentStep()) return;
            
            // Visual feedback: Disable button and show loading state
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.75';
            submitBtn.innerHTML = `
                <span class="btn-text">Processing...</span>
                <span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation: spin 0.8s linear infinite; margin-left: 8px;"></span>
            `;
            
            // Gather form field values
            const name = document.getElementById('input-name').value;
            const businessNameInput = document.getElementById('input-business-name');
            const businessName = businessNameInput ? businessNameInput.value : '';
            const companyWebsiteInput = document.getElementById('input-company-website');
            const companyWebsite = companyWebsiteInput ? companyWebsiteInput.value : '';
            const email = document.getElementById('input-email').value;
            const phone = document.getElementById('input-phone').value;
            const serviceSelect = document.getElementById('select-service');
            const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;
            const budgetSelect = document.getElementById('select-budget');
            const budgetText = budgetSelect.options[budgetSelect.selectedIndex].text;
            const details = document.getElementById('textarea-details').value;
            
            // Construct the payload to match the Google Sheet headers exactly and prevent column shifts
            const payload = {
                "NAME": name,
                "Business Name": businessName,
                "Company Website": companyWebsite,
                "Email": email,
                "Phone Number": phone,
                "Service Needed": serviceText,
                "Budget": budgetText,
                "Project Details": details
            };
            
            // Set up Google Sheet Webhook URL (from connect.appsglobal.co)
            const webhookURL = 'https://script.google.com/macros/s/AKfycbxQIe34Fe1DyUI5cJLpMsFwq0tf5qBsWLtd4sK4bsE61yM39ObLHZ0MmWa2FGel2z-KYw/exec';
            
            let redirected = false;
            const handleRedirect = () => {
                if (!redirected) {
                    redirected = true;
                    window.location.href = 'thankyou.html';
                }
            };
            
            // Set fallback timeout: redirect to thankyou page if API is slow (1.5 seconds)
            const fallbackTimeout = setTimeout(() => {
                console.log('Webhook request timed out. Redirecting to success page.');
                handleRedirect();
            }, 1500);
            
            // Post payload to webhook
            fetch(webhookURL, {
                method: 'POST',
                mode: 'no-cors', // Avoid CORS errors with Google Script redirection
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(payload)
            })
            .then(() => {
                clearTimeout(fallbackTimeout);
                handleRedirect();
            })
            .catch((error) => {
                console.error('Submission error:', error);
                clearTimeout(fallbackTimeout);
                handleRedirect();
            });
        });
    }
});

// CSS spin animation definition injected dynamically for the loader
const style = document.createElement('style');
style.innerHTML = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
