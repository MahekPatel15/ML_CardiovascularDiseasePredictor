document.addEventListener("DOMContentLoaded", () => {

    // ----------------------------------------------------
    // TAB NAVIGATION (For Standalone Dashboard)
    // ----------------------------------------------------
    const tabAnalyzer = document.getElementById("tab-analyzer");
    const tabInsights = document.getElementById("tab-insights");
    const panelAnalyzer = document.getElementById("panel-analyzer");
    const panelInsights = document.getElementById("panel-insights");

    if (tabAnalyzer && tabInsights && panelAnalyzer && panelInsights) {
        tabAnalyzer.addEventListener("click", () => {
            tabAnalyzer.classList.add("active");
            tabAnalyzer.setAttribute("aria-selected", "true");
            tabAnalyzer.setAttribute("tabindex", "0");

            tabInsights.classList.remove("active");
            tabInsights.setAttribute("aria-selected", "false");
            tabInsights.setAttribute("tabindex", "-1");

            panelAnalyzer.classList.add("active");
            panelAnalyzer.removeAttribute("hidden");

            panelInsights.classList.remove("active");
            panelInsights.setAttribute("hidden", "true");
        });

        tabInsights.addEventListener("click", () => {
            tabInsights.classList.add("active");
            tabInsights.setAttribute("aria-selected", "true");
            tabInsights.setAttribute("tabindex", "0");

            tabAnalyzer.classList.remove("active");
            tabAnalyzer.setAttribute("aria-selected", "false");
            tabAnalyzer.setAttribute("tabindex", "-1");

            panelInsights.classList.add("active");
            panelInsights.removeAttribute("hidden");

            panelAnalyzer.classList.remove("active");
            panelAnalyzer.setAttribute("hidden", "true");
        });
    }

    // ----------------------------------------------------
    // MOBILE NAVIGATION DRAWER (For Template Layouts)
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
    const formErrorAlert = document.getElementById("form-error-alert");
    const formErrorText = document.getElementById("form-error-text");
    
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

    // Dynamic Circular Progress Indicator (reads SVG r attribute)
    const ringRadius = progressIndicator ? (parseFloat(progressIndicator.getAttribute("r")) || 80) : 80;
    const ringCircumference = 2 * Math.PI * ringRadius;
    if (progressIndicator) {
        progressIndicator.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
        progressIndicator.style.strokeDashoffset = ringCircumference;
    }

    function setGaugeProgress(percent) {
        if (!progressIndicator) return;
        const clampedPercent = Math.min(Math.max(percent, 0), 100);
        const offset = ringCircumference - (clampedPercent / 100) * ringCircumference;
        progressIndicator.style.strokeDashoffset = offset;
    }

    // High-Visibility Error Handlers
    function showFormError(msg) {
        if (formErrorAlert) {
            if (formErrorText) {
                formErrorText.textContent = msg;
            } else {
                formErrorAlert.textContent = msg;
            }
            formErrorAlert.classList.remove("hidden");
            formErrorAlert.classList.add("visible");
            formErrorAlert.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (errorBpRelation && !errorBpRelation.textContent) {
            errorBpRelation.textContent = msg;
            errorBpRelation.style.display = "flex";
        }
    }

    function clearFormError() {
        if (formErrorAlert) {
            if (formErrorText) formErrorText.textContent = "";
            formErrorAlert.classList.add("hidden");
            formErrorAlert.classList.remove("visible");
        }
        if (errorBpRelation) {
            errorBpRelation.textContent = "";
            errorBpRelation.style.display = "none";
        }
        [ageInput, apHiInput, apLoInput].forEach(inp => {
            if (inp) inp.classList.remove("is-invalid");
        });
    }

    // Real-Time Form Input Validations
    function validateFormInputs() {
        if (!ageInput || !apHiInput || !apLoInput) return true;
        let isValid = true;
        let firstInvalidField = null;

        if (errorAge) errorAge.textContent = "";
        if (errorApHi) errorApHi.textContent = "";
        if (errorApLo) errorApLo.textContent = "";
        clearFormError();

        // 1. Age (18 to 100)
        const age = parseInt(ageInput.value, 10);
        if (isNaN(age) || age < 18 || age > 100) {
            if (errorAge) errorAge.textContent = "Please enter an age between 18 and 100 years.";
            ageInput.classList.add("is-invalid");
            isValid = false;
            if (!firstInvalidField) firstInvalidField = ageInput;
        } else {
            ageInput.classList.remove("is-invalid");
        }

        // 2. Systolic Blood Pressure (60 to 250)
        const apHi = parseInt(apHiInput.value, 10);
        if (isNaN(apHi) || apHi < 60 || apHi > 250) {
            if (errorApHi) errorApHi.textContent = "Systolic blood pressure must be between 60 and 250 mmHg.";
            apHiInput.classList.add("is-invalid");
            isValid = false;
            if (!firstInvalidField) firstInvalidField = apHiInput;
        } else {
            apHiInput.classList.remove("is-invalid");
        }

        // 3. Diastolic Blood Pressure (40 to 200)
        const apLo = parseInt(apLoInput.value, 10);
        if (isNaN(apLo) || apLo < 40 || apLo > 200) {
            if (errorApLo) errorApLo.textContent = "Diastolic blood pressure must be between 40 and 200 mmHg.";
            apLoInput.classList.add("is-invalid");
            isValid = false;
            if (!firstInvalidField) firstInvalidField = apLoInput;
        } else {
            apLoInput.classList.remove("is-invalid");
        }

        // 4. Clinical Cross-Check: ap_hi >= ap_lo
        if (isValid && apHi < apLo) {
            const bpMsg = "Clinical Conflict: Systolic pressure (ap_hi) cannot be lower than Diastolic pressure (ap_lo).";
            if (errorBpRelation) {
                errorBpRelation.textContent = bpMsg;
                errorBpRelation.style.display = "flex";
            }
            showFormError(bpMsg);
            apHiInput.classList.add("is-invalid");
            apLoInput.classList.add("is-invalid");
            isValid = false;
            if (!firstInvalidField) firstInvalidField = apHiInput;
        }

        if (!isValid && firstInvalidField) {
            firstInvalidField.focus();
        }

        return isValid;
    }

    [ageInput, apHiInput, apLoInput].forEach(input => {
        if (input) {
            input.addEventListener("input", () => {
                if (errorAge) errorAge.textContent = "";
                if (errorApHi) errorApHi.textContent = "";
                if (errorApLo) errorApLo.textContent = "";
                clearFormError();
            });
        }
    });


    // ----------------------------------------------------
    // FORM SUBMISSION & BACKEND API CALL
    // ----------------------------------------------------
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!validateFormInputs()) {
                showFormError("Please correct the highlighted clinical values above before submitting.");
                return;
            }

            clearFormError();

            if (submitBtn) submitBtn.disabled = true;
            if (btnText) btnText.classList.add("hidden");
            if (btnLoader) btnLoader.classList.remove("hidden");

            // Extract all 11 model features defensively
            const formData = new FormData(form);

            const genderEl = form.querySelector('input[name="gender"]:checked');
            const genderVal = genderEl ? parseInt(genderEl.value, 10) : (parseInt(formData.get("gender"), 10) || 1);

            const heightInput = document.getElementById("height");
            const heightVal = heightInput ? parseFloat(heightInput.value) : (parseFloat(formData.get("height")) || 165.0);

            const weightInput = document.getElementById("weight");
            const weightVal = weightInput ? parseFloat(weightInput.value) : (parseFloat(formData.get("weight")) || 70.0);

            const apHiVal = apHiInput ? parseInt(apHiInput.value, 10) : (parseInt(formData.get("ap_hi"), 10) || 120);
            const apLoVal = apLoInput ? parseInt(apLoInput.value, 10) : (parseInt(formData.get("ap_lo"), 10) || 80);

            const cholEl = form.querySelector('input[name="cholesterol"]:checked');
            const cholVal = cholEl ? parseInt(cholEl.value, 10) : (parseInt(formData.get("cholesterol"), 10) || 1);

            const glucEl = form.querySelector('input[name="gluc"]:checked');
            const glucVal = glucEl ? parseInt(glucEl.value, 10) : (parseInt(formData.get("gluc"), 10) || 1);

            const smokeVal = document.getElementById("smoke")?.checked ? 1 : 0;
            const alcoVal = document.getElementById("alco")?.checked ? 1 : 0;
            const activeVal = document.getElementById("active")?.checked ? 1 : 0;

            const ageVal = ageInput ? parseInt(ageInput.value, 10) : (parseInt(formData.get("age_years"), 10) || 45);

            const payload = {
                gender: genderVal,
                height: heightVal,
                weight: weightVal,
                ap_hi: apHiVal,
                ap_lo: apLoVal,
                cholesterol: cholVal,
                gluc: glucVal,
                smoke: smokeVal,
                alco: alcoVal,
                active: activeVal,
                age_years: ageVal
            };

            try {
                // Determine API endpoint: use relative /api/predict on HTTP/HTTPS or local port fallback on file://
                const isLocalFile = window.location.protocol === "file:";
                const apiUrl = isLocalFile ? "http://127.0.0.1:8000/api/predict" : "/api/predict";

                let response;
                try {
                    response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    });
                } catch (networkErr) {
                    throw new Error(
                        `Cannot connect to prediction server at ${apiUrl}. ` +
                        `Please verify the backend is running (run: /opt/anaconda3/bin/python3 app.py).`
                    );
                }

                if (response.status === 429) {
                    throw new Error("Rate limit exceeded. Too many requests. Please wait a minute before submitting again.");
                }

                if (!response.ok) {
                    let errorDetail = "Server error occurred during analysis.";
                    try {
                        const errorData = await response.json();
                        if (typeof errorData.detail === "string") {
                            errorDetail = errorData.detail;
                        } else if (Array.isArray(errorData.detail)) {
                            errorDetail = errorData.detail.map(d => {
                                const loc = Array.isArray(d.loc) ? d.loc.filter(x => x !== 'body').join('.') : '';
                                return loc ? `${loc}: ${d.msg}` : (d.msg || JSON.stringify(d));
                            }).join("; ");
                        } else if (errorData.message) {
                            errorDetail = errorData.message;
                        }
                    } catch (_) {
                        errorDetail = `Request failed (${response.status}: ${response.statusText})`;
                    }
                    throw new Error(errorDetail);
                }

                const data = await response.json();
                displayAssessmentReport(data, payload);

            } catch (error) {
                showFormError(error.message);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.classList.remove("hidden");
                if (btnLoader) btnLoader.classList.add("hidden");
            }
        });
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
            let status = "Low Risk";
            let badgeClass = "risk-low";

            if (riskPercent >= 60) {
                status = "High Risk";
                badgeClass = "risk-high";
            } else if (riskPercent >= 30) {
                status = "Moderate Risk";
                badgeClass = "risk-moderate";
            }

            riskStatusBadge.className = `severity-badge ${badgeClass}`;
            riskStatusBadge.textContent = status;
        }

        generateRecommendations(inputs);

        // Smooth scroll to result card on small screens
        if (window.innerWidth < 1024) {
            cardResult.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
                text: `Body Mass Index (BMI: ${bmi}) is in the overweight/obese category. Balanced nutrition and regular physical activity are recommended.`
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check text-emerald-600",
                text: `Optimal Body Mass Index logged (BMI: ${bmi}). Continue your nutritional and activity regimen.`
            });
        }

        // 2. Blood pressure check
        if (inputs.ap_hi >= 140 || inputs.ap_lo >= 90) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-rose-600",
                text: `Stage 2 Hypertensive Blood Pressure (${inputs.ap_hi}/${inputs.ap_lo} mmHg). Please consult a physician promptly.`
            });
        } else if (inputs.ap_hi >= 120 || inputs.ap_lo >= 80) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: `Elevated / Pre-hypertensive Blood Pressure (${inputs.ap_hi}/${inputs.ap_lo} mmHg). Reduce dietary sodium and monitor regularly.`
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check text-emerald-600",
                text: `Normal Blood Pressure profile (${inputs.ap_hi}/${inputs.ap_lo} mmHg).`
            });
        }

        // 3. Cholesterol & Sugar
        if (inputs.cholesterol > 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: "Elevated cholesterol level detected. Limit saturated fats and increase soluble dietary fiber."
            });
        }
        if (inputs.gluc > 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: "Elevated blood glucose detected. Minimize added sugars and refined carbohydrates."
            });
        }

        // 4. Lifestyle indicators
        if (inputs.smoke === 1) {
            recommendations.push({
                icon: "fa-solid fa-circle-xmark text-rose-600",
                text: "Smoking significantly increases arterial plaque risk. Smoking cessation is strongly advised."
            });
        }
        if (inputs.alco === 1) {
            recommendations.push({
                icon: "fa-solid fa-triangle-exclamation text-amber-600",
                text: "Limit alcohol intake to maintain healthy arterial compliance and cardiovascular stability."
            });
        }
        if (inputs.active === 0) {
            recommendations.push({
                icon: "fa-solid fa-circle-xmark text-rose-600",
                text: "Sedentary activity level logged. Incorporate at least 150 minutes of moderate aerobic activity weekly."
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check text-emerald-600",
                text: "Active physical lifestyle maintained. Regular activity fortifies myocardial strength."
            });
        }

        recommendations.forEach(rec => {
            const li = document.createElement("li");
            li.innerHTML = `<i class="${rec.icon}"></i> <span>${rec.text}</span>`;
            adviceContainer.appendChild(li);
        });
    }

    // Reset Form logic
    if (resetBtn && form) {
        resetBtn.addEventListener("click", () => {
            form.reset();
            
            // Restore default values for range sliders and text displays
            const hSlider = document.getElementById("height");
            const wSlider = document.getElementById("weight");
            if (hSlider) hSlider.value = "165";
            if (wSlider) wSlider.value = "70";
            if (heightVal) heightVal.textContent = "165 cm";
            if (weightVal) weightVal.textContent = "70 kg";
            
            // Clear validation errors and alerts
            clearFormError();
            if (errorAge) errorAge.textContent = "";
            if (errorApHi) errorApHi.textContent = "";
            if (errorApLo) errorApLo.textContent = "";
            
            // Revert results UI back to awaiting state
            if (cardResult) cardResult.classList.add("hidden");
            if (placeholderResult) placeholderResult.classList.remove("hidden");
            setGaugeProgress(0);

            // Scroll back smoothly to top of form
            form.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }
});
