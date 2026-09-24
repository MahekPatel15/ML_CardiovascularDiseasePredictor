document.addEventListener("DOMContentLoaded", () => {

    // ----------------------------------------------------
    // MOBILE NAVIGATION DRAWER
    // ----------------------------------------------------
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("hidden");
        });
    }


    // ----------------------------------------------------
    // LIVE SLIDER READOUT UPDATES
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
    // PREDICTOR FORM & VALIDATION LOGIC
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
    const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
    const btnLoader = submitBtn ? submitBtn.querySelector(".btn-loader") : null;

    // UI Result Components
    const placeholderResult = document.getElementById("placeholder-result");
    const cardResult = document.getElementById("card-result");
    const riskScoreText = document.getElementById("risk-score");
    const riskStatusBadge = document.getElementById("risk-status");
    const progressIndicator = document.getElementById("progress-indicator");
    const adviceContainer = document.getElementById("advice-container");
    const resetBtn = document.getElementById("reset-btn");

    // Circular progress indicator configuration (radius = 80, matches SVG r="80")
    const ringRadius = 80;
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
        if (!ageInput || !apHiInput || !apLoInput) return true;
        let isValid = true;

        if (errorAge) errorAge.textContent = "";
        if (errorApHi) errorApHi.textContent = "";
        if (errorApLo) errorApLo.textContent = "";
        if (errorBpRelation) errorBpRelation.textContent = "";

        // Validate Age (18 to 100)
        const age = parseInt(ageInput.value, 10);
        if (isNaN(age) || age < 18 || age > 100) {
            if (errorAge) errorAge.textContent = "Please enter an age between 18 and 100 years.";
            isValid = false;
        }

        // Validate Systolic BP
        const apHi = parseInt(apHiInput.value, 10);
        if (isNaN(apHi) || apHi < 60 || apHi > 250) {
            if (errorApHi) errorApHi.textContent = "Systolic blood pressure must be between 60 and 250 mmHg.";
            isValid = false;
        }

        // Validate Diastolic BP
        const apLo = parseInt(apLoInput.value, 10);
        if (isNaN(apLo) || apLo < 40 || apLo > 200) {
            if (errorApLo) errorApLo.textContent = "Diastolic blood pressure must be between 40 and 200 mmHg.";
            isValid = false;
        }

        // Cross-field validation: ap_hi >= ap_lo
        if (isValid && apHi < apLo) {
            if (errorBpRelation) errorBpRelation.textContent = "Error: Systolic pressure (ap_hi) cannot be lower than Diastolic pressure (ap_lo).";
            isValid = false;
        }

        return isValid;
    }

    [ageInput, apHiInput, apLoInput].forEach(input => {
        if (input) {
            input.addEventListener("input", validateFormInputs);
        }
    });


    // ----------------------------------------------------
    // FORM SUBMISSION & BACKEND API CALL
    // ----------------------------------------------------
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!validateFormInputs()) {
                return;
            }

            if (submitBtn) submitBtn.disabled = true;
            if (btnText) btnText.classList.add("hidden");
            if (btnLoader) btnLoader.classList.remove("hidden");

            const formData = new FormData(form);
            
            const payload = {
                gender: parseInt(formData.get("gender"), 10),
                height: parseFloat(formData.get("height")),
                weight: parseFloat(formData.get("weight")),
                ap_hi: parseInt(formData.get("ap_hi"), 10),
                ap_lo: parseInt(formData.get("ap_lo"), 10),
                cholesterol: parseInt(formData.get("cholesterol"), 10),
                gluc: parseInt(formData.get("gluc"), 10),
                smoke: document.getElementById("smoke")?.checked ? 1 : 0,
                alco: document.getElementById("alco")?.checked ? 1 : 0,
                active: document.getElementById("active")?.checked ? 1 : 0,
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
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.classList.remove("hidden");
                if (btnLoader) btnLoader.classList.add("hidden");
            }
        });
    }

    function loggerError(msg) {
        if (errorBpRelation) {
            errorBpRelation.textContent = `System Alert: ${msg}`;
            errorBpRelation.style.color = "#be123c";
        }
    }


    // ----------------------------------------------------
    // ASSESSMENT REPORT & DYNAMIC RECOMMENDATIONS
    // ----------------------------------------------------
    function displayAssessmentReport(result, inputs) {
        if (!placeholderResult || !cardResult) return;

        placeholderResult.classList.add("hidden");
        cardResult.classList.remove("hidden");

        const riskPercent = Math.round(result.risk_probability * 100);
        if (riskScoreText) riskScoreText.textContent = `${riskPercent}%`;
        setGaugeProgress(riskPercent);

        if (riskStatusBadge) {
            riskStatusBadge.className = "severity-badge inline-block px-5 py-2 rounded-full font-outfit font-bold text-sm tracking-wide shadow-sm";
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
        }

        generateRecommendations(inputs);
    }

    function generateRecommendations(inputs) {
        if (!adviceContainer) return;
        adviceContainer.innerHTML = "";
        const recommendations = [];

        // 1. BMI calculation
        const heightMeters = inputs.height / 100;
        const bmi = (inputs.weight / (heightMeters * heightMeters)).toFixed(1);
        
        if (bmi >= 25.0) {
            recommendations.push({
                icon: "fa-solid fa-circle-xmark text-rose-600",
                text: `Your Body Mass Index (BMI: ${bmi}) indicates overweight/obesity range. Balanced nutrition and exercise are recommended.`
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check text-emerald-600",
                text: `Optimal Body Mass Index detected (BMI: ${bmi}). Maintain physical activity.`
            });
        }

        // 2. Blood pressure check
        if (inputs.ap_hi >= 140 || inputs.ap_lo >= 90) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: `Hypertensive Blood Pressure detected (${inputs.ap_hi}/${inputs.ap_lo} mmHg). Consult a healthcare provider.`
            });
        } else if (inputs.ap_hi >= 120 || inputs.ap_lo >= 80) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: `Pre-hypertensive Blood Pressure detected (${inputs.ap_hi}/${inputs.ap_lo} mmHg). Low-sodium diet recommended.`
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check text-emerald-600",
                text: `Optimal Blood Pressure profile logged (${inputs.ap_hi}/${inputs.ap_lo} mmHg).`
            });
        }

        // 3. Cholesterol & Sugar
        if (inputs.cholesterol > 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: "Elevated cholesterol detected. Limit saturated fats and incorporate fiber-rich foods."
            });
        }
        if (inputs.gluc > 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: "Elevated blood glucose detected. Limit refined sugars and processed carbohydrates."
            });
        }

        // 4. Lifestyle indicators
        if (inputs.smoke === 1) {
            recommendations.push({
                icon: "fa-solid fa-circle-xmark text-rose-600",
                text: "Tobacco smoking increases vascular pressure. Cessation program recommended."
            });
        }
        if (inputs.alco === 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: "Moderate or eliminate alcohol intake to support arterial health."
            });
        }
        if (inputs.active === 0) {
            recommendations.push({
                icon: "fa-solid fa-circle-xmark text-rose-600",
                text: "Sedentary lifestyle detected. Aim for at least 150 minutes of weekly aerobic exercise."
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check text-emerald-600",
                text: "Physical activity target achieved. Regular aerobic exercise supports myocardial strength."
            });
        }

        recommendations.forEach(rec => {
            const li = document.createElement("li");
            li.className = "flex items-start gap-2.5 p-3 rounded-xl bg-[#F4F8FA] border border-[#DEEBF7]/70";
            li.innerHTML = `<i class="${rec.icon} mt-0.5 text-sm flex-shrink-0"></i> <span class="leading-relaxed text-slate-700">${rec.text}</span>`;
            adviceContainer.appendChild(li);
        });
    }

    // Reset Form logic
    if (resetBtn && form) {
        resetBtn.addEventListener("click", () => {
            form.reset();
            if (heightVal) heightVal.textContent = "165 cm";
            if (weightVal) weightVal.textContent = "70 kg";
            
            if (cardResult) cardResult.classList.add("hidden");
            if (placeholderResult) placeholderResult.classList.remove("hidden");
            setGaugeProgress(0);
        });
    }
});
