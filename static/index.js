document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // TAB SYSTEM CONTROL
    // ----------------------------------------------------
    const tabs = document.querySelectorAll(".nav-tab");
    const panels = document.querySelectorAll(".tab-panel");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Remove active classes
            tabs.forEach(t => {
                t.classList.remove("active");
                t.setAttribute("aria-selected", "false");
                t.setAttribute("tabindex", "-1");
            });
            panels.forEach(p => p.classList.remove("active"));

            // Add active classes to selected tab
            tab.classList.add("active");
            tab.setAttribute("aria-selected", "true");
            tab.setAttribute("tabindex", "0");
            
            const targetPanelId = tab.getAttribute("aria-controls");
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add("active");
                targetPanel.removeAttribute("hidden");
            }

            // Hide other panels
            panels.forEach(p => {
                if (p.id !== targetPanelId) {
                    p.setAttribute("hidden", "true");
                }
            });
        });
    });

    // Keyboard navigation for tabs
    const tabList = document.querySelector('[role="tablist"]');
    if (tabList) {
        tabList.addEventListener("keydown", (e) => {
            const tabsArray = Array.from(tabs);
            let index = tabsArray.indexOf(document.activeElement);

            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                index = (index + 1) % tabsArray.length;
                tabsArray[index].focus();
                tabsArray[index].click();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                index = (index - 1 + tabsArray.length) % tabsArray.length;
                tabsArray[index].focus();
                tabsArray[index].click();
            }
        });
    }


    // ----------------------------------------------------
    // LIVE SLIDER DISPLAY UPDATES
    // ----------------------------------------------------
    const heightSlider = document.getElementById("height");
    const heightVal = document.getElementById("height-val");
    const weightSlider = document.getElementById("weight");
    const weightVal = document.getElementById("weight-val");

    if (heightSlider && heightVal) {
        heightSlider.addEventListener("input", (e) => {
            heightVal.textContent = `${e.target.value} cm`;
        });
    }

    if (weightSlider && weightVal) {
        weightSlider.addEventListener("input", (e) => {
            weightVal.textContent = `${e.target.value} kg`;
        });
    }


    // ----------------------------------------------------
    // FORM VALIDATION & LOGIC
    // ----------------------------------------------------
    const form = document.getElementById("analyzer-form");
    const ageInput = document.getElementById("age_years");
    const apHiInput = document.getElementById("ap_hi");
    const apLoInput = document.getElementById("ap_lo");
    
    const errorAge = document.getElementById("error-age");
    const errorApHi = document.getElementById("error-ap-hi");
    const errorApLo = document.getElementById("error-ap-lo");
    const errorBpRelation = document.getElementById("error-bp-relation");
    
    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoader = submitBtn.querySelector(".btn-loader");

    // UI Result Components
    const placeholderResult = document.getElementById("placeholder-result");
    const cardResult = document.getElementById("card-result");
    const riskScoreText = document.getElementById("risk-score");
    const riskStatusBadge = document.getElementById("risk-status");
    const progressIndicator = document.getElementById("progress-indicator");
    const adviceContainer = document.getElementById("advice-container");
    const resetBtn = document.getElementById("reset-btn");

    // Circular progress indicator configuration (radius = 90)
    const ringRadius = 90;
    const ringCircumference = 2 * Math.PI * ringRadius;
    if (progressIndicator) {
        progressIndicator.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
        progressIndicator.style.strokeDashoffset = ringCircumference;
    }

    function setGaugeProgress(percent) {
        if (!progressIndicator) return;
        const offset = ringCircumference - (percent / 100) * ringCircumference;
        progressIndicator.style.strokeDashoffset = offset;
    }

    // Real-time validations
    function validateFormInputs() {
        let isValid = true;

        // Reset error text
        errorAge.textContent = "";
        errorApHi.textContent = "";
        errorApLo.textContent = "";
        errorBpRelation.textContent = "";

        // Validate Age (18 to 100)
        const age = parseInt(ageInput.value, 10);
        if (isNaN(age) || age < 18 || age > 100) {
            errorAge.textContent = "Please enter an age between 18 and 100 years.";
            isValid = false;
        }

        // Validate Systolic BP
        const apHi = parseInt(apHiInput.value, 10);
        if (isNaN(apHi) || apHi < 60 || apHi > 250) {
            errorApHi.textContent = "Systolic blood pressure must be between 60 and 250 mmHg.";
            isValid = false;
        }

        // Validate Diastolic BP
        const apLo = parseInt(apLoInput.value, 10);
        if (isNaN(apLo) || apLo < 40 || apLo > 200) {
            errorApLo.textContent = "Diastolic blood pressure must be between 40 and 200 mmHg.";
            isValid = false;
        }

        // Cross-field validation: ap_hi >= ap_lo
        if (isValid && apHi < apLo) {
            errorBpRelation.textContent = "Error: Systolic pressure (ap_hi) cannot be lower than Diastolic pressure (ap_lo).";
            isValid = false;
        }

        return isValid;
    }

    // Attach event listeners for real-time input correction warning
    [ageInput, apHiInput, apLoInput].forEach(input => {
        input.addEventListener("input", () => {
            validateFormInputs();
        });
    });


    // ----------------------------------------------------
    // FORM SUBMISSION & BACKEND API CALL
    // ----------------------------------------------------
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!validateFormInputs()) {
            return; // Halt if client-side validation failed
        }

        // Set Loading state
        submitBtn.disabled = true;
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");

        // Collect parameters from inputs
        const formData = new FormData(form);
        
        // Assemble payload matching API specifications
        const payload = {
            gender: parseInt(formData.get("gender"), 10),
            height: parseFloat(formData.get("height")),
            weight: parseFloat(formData.get("weight")),
            ap_hi: parseInt(formData.get("ap_hi"), 10),
            ap_lo: parseInt(formData.get("ap_lo"), 10),
            cholesterol: parseInt(formData.get("cholesterol"), 10),
            gluc: parseInt(formData.get("gluc"), 10),
            smoke: document.getElementById("smoke").checked ? 1 : 0,
            alco: document.getElementById("alco").checked ? 1 : 0,
            active: document.getElementById("active").checked ? 1 : 0,
            age_years: parseInt(formData.get("age_years"), 10)
        };
        try {
            const isLocalFile = window.location.protocol === "file:";
            const apiUrl = isLocalFile ? "http://127.0.0.1:8000/api/predict" : "/api/predict";

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                throw new Error("Too many predictions. Please wait a minute before trying again.");
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Server error occurred during analysis.");
            }

            const data = await response.json();
            displayAssessmentReport(data, payload);

        } catch (error) {
            loggerError(error.message);
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            btnText.classList.remove("hidden");
            btnLoader.classList.add("hidden");
        }
    });

    function loggerError(msg) {
        errorBpRelation.textContent = `System Alert: ${msg}`;
        errorBpRelation.style.color = "var(--color-danger)";
    }


    // ----------------------------------------------------
    // DYNAMIC HEALTH REPORT & RECOMMENDATIONS GENERATION
    // ----------------------------------------------------
    function displayAssessmentReport(result, inputs) {
        // Toggle view visibility
        placeholderResult.classList.add("hidden");
        cardResult.classList.remove("hidden");

        // Set probability risk score
        const riskPercent = Math.round(result.risk_probability * 100);
        riskScoreText.textContent = `${riskPercent}%`;
        setGaugeProgress(riskPercent);

        // Define Risk category and theme color
        riskStatusBadge.className = "severity-badge"; // Reset classes
        let status = "Low Risk";
        let badgeClass = "risk-low";

        if (riskPercent >= 60) {
            status = "High Risk";
            badgeClass = "risk-high";
        } else if (riskPercent >= 30) {
            status = "Moderate Risk";
            badgeClass = "risk-moderate";
        }
        
        riskStatusBadge.textContent = status;
        riskStatusBadge.classList.add(badgeClass);

        // Generate medical recommendations based on parameters
        generateRecommendations(inputs);
    }

    function generateRecommendations(inputs) {
        adviceContainer.innerHTML = ""; // Clear existing recommendations
        const recommendations = [];

        // 1. BMI check
        const heightMeters = inputs.height / 100;
        const bmi = (inputs.weight / (heightMeters * heightMeters)).toFixed(1);
        
        if (bmi >= 25.0) {
            recommendations.push({
                icon: "fa-solid fa-circle-xmark",
                class: "fa-circle-xmark",
                text: `Your Body Mass Index (BMI: ${bmi}) is in the overweight/obese range. Focused exercise and nutritional modifications can lower vascular pressure.`
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check",
                class: "fa-circle-check",
                text: `Healthy BMI index detected (${bmi}). Maintain balanced dietary patterns to stabilize physical stats.`
            });
        }

        // 2. Blood pressure check
        if (inputs.ap_hi >= 140 || inputs.ap_lo >= 90) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation",
                class: "fa-triangle-exclamation",
                text: `Hypertensive Blood Pressure values logged (${inputs.ap_hi}/${inputs.ap_lo} mmHg). We strongly advise consulting a healthcare professional for diagnosis.`
            });
        } else if (inputs.ap_hi >= 120 || inputs.ap_lo >= 80) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation",
                class: "fa-triangle-exclamation",
                text: `Pre-hypertensive Blood Pressure values logged (${inputs.ap_hi}/${inputs.ap_lo} mmHg). Focus on a low-sodium diet and stress reduction techniques.`
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check",
                class: "fa-circle-check",
                text: `Optimal Blood Pressure profile detected (${inputs.ap_hi}/${inputs.ap_lo} mmHg).`
            });
        }

        // 3. Cholesterol & Sugar
        if (inputs.cholesterol > 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation",
                class: "fa-triangle-exclamation",
                text: "Elevated cholesterol levels detected. Limit saturated fats and incorporate fiber-rich foods like whole grains, oats, and legumes."
            });
        }
        if (inputs.gluc > 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation",
                class: "fa-triangle-exclamation",
                text: "Elevated blood glucose levels detected. Decrease intake of processed carbohydrates and sugars, and screen for diabetes risk."
            });
        }

        // 4. Lifestyle indicators
        if (inputs.smoke === 1) {
            recommendations.push({
                icon: "fa-solid fa-circle-xmark",
                class: "fa-circle-xmark",
                text: "Tobacco smoking accelerates arterial stiffening. Initiating a smoking cessation program is critical to lower cardiovascular risk."
            });
        }
        if (inputs.alco === 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation",
                class: "fa-triangle-exclamation",
                text: "High alcohol consumption elevates blood pressure. Limit drinks to standard medically-approved levels or eliminate entirely."
            });
        }
        if (inputs.active === 0) {
            recommendations.push({
                icon: "fa-solid fa-circle-xmark",
                class: "fa-circle-xmark",
                text: "Sedentary lifestyle detected. Aim for at least 150 minutes of moderate-intensity physical activity (such as brisk walking) per week."
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check",
                class: "fa-circle-check",
                text: "Physical activity target achieved. Regular aerobic exercise supports strong myocardial performance."
            });
        }

        // Render lists to container
        recommendations.forEach(rec => {
            const li = document.createElement("li");
            li.innerHTML = `<i class="${rec.icon} ${rec.class}"></i> <span>${rec.text}</span>`;
            adviceContainer.appendChild(li);
        });
    }

    // Reset flow
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            form.reset();
            // Reset slider display texts
            heightVal.textContent = "165 cm";
            weightVal.textContent = "70 kg";
            
            // Hide report card, show input placeholder
            cardResult.classList.add("hidden");
            placeholderResult.classList.remove("hidden");
            setGaugeProgress(0);
        });
    }
});
