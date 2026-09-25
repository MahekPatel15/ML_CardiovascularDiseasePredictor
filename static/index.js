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

    function showFormError(msg) {
        if (formErrorAlert && formErrorText) {
            formErrorText.textContent = msg;
            formErrorAlert.classList.remove("hidden");
        }
        if (errorBpRelation && !errorBpRelation.textContent) {
            errorBpRelation.textContent = msg;
        }
    }

    function clearFormError() {
        if (formErrorAlert && formErrorText) {
            formErrorText.textContent = "";
            formErrorAlert.classList.add("hidden");
        }
        if (errorBpRelation) {
            errorBpRelation.textContent = "";
        }
    }

    // Real-time validations
    function validateFormInputs() {
        if (!ageInput || !apHiInput || !apLoInput) return true;
        let isValid = true;

        if (errorAge) errorAge.textContent = "";
        if (errorApHi) errorApHi.textContent = "";
        if (errorApLo) errorApLo.textContent = "";
        clearFormError();

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
            const bpMsg = "Systolic blood pressure (ap_hi) cannot be lower than Diastolic blood pressure (ap_lo).";
            if (errorBpRelation) errorBpRelation.textContent = bpMsg;
            showFormError(bpMsg);
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
                showFormError("Please correct the clinical values highlighted above.");
                return;
            }

            clearFormError();

            if (submitBtn) submitBtn.disabled = true;
            if (btnText) btnText.classList.add("hidden");
            if (btnLoader) btnLoader.classList.remove("hidden");

            // Extract values defensively from both FormData and direct DOM elements
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
                    throw new Error("Rate limit exceeded. Please wait a minute before submitting again.");
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
                text: `Body Mass Index (BMI: ${bmi}) is in the overweight/obesity range. A heart-healthy diet and regular exercise are recommended.`
            });
        } else {
            recommendations.push({
                icon: "fa-solid fa-circle-check text-emerald-600",
                text: `Optimal Body Mass Index (BMI: ${bmi}). Continue balanced nutritional habits.`
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
                text: "Elevated cholesterol level detected. Limit saturated fats and increase soluble fiber."
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
            li.className = "flex items-start gap-2.5 p-3 rounded-xl bg-[#F4F8FA] border border-[#DEEBF7]/70";
            li.innerHTML = `<i class="${rec.icon} mt-0.5 text-sm flex-shrink-0"></i> <span class="leading-relaxed text-slate-700">${rec.text}</span>`;
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
