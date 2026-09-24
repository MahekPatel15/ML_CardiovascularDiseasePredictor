# CardioGuard AI - Production Clinical Cardiovascular Risk Platform

CardioGuard AI is a 4-page clinical cardiovascular disease screening web application powered by machine learning decision tree models and FastAPI.

---

## 1. Directory Structure

```text
ML PROJECT/
├── app.py                              # FastAPI REST API & Jinja2 template routes
├── model.pkl                           # Trained Scikit-Learn DecisionTree model
├── scaler.pkl                          # Fitted StandardScaler model
├── cardio_train.csv                    # Kaggle Cardiovascular Disease Dataset
├── Cardio_Cleaning_DecisionTree.ipynb   # Data cleaning, EDA & model notebook
├── README.md                           # System documentation
├── templates/                          # Jinja2 template pages
│   ├── base.html                       # Base layout (Header nav, footer, theme switcher)
│   ├── index.html                      # Home page (/)
│   ├── predictor.html                  # Predictor page (/predictor)
│   ├── insights.html                   # Data Insights page (/insights)
│   └── about.html                      # About page (/about)
└── static/                             # Static web assets
    ├── index.css                       # Custom CSS styling (Light/Dark themes, gauge animation)
    └── index.js                        # Client JS (Theme toggle, sliders, API call, gauge animation)
```

---

## 2. 4-Page System Architecture

1. **Home (`/`)**:
   - Hero section with value proposition, real stats strip (65,435 records, 11 features, 87.2% model accuracy), "How it Works" 3-step breakdown, and primary CTAs.
2. **Predictor (`/predictor`)**:
   - Redesigned 2-column diagnostic assessment tool:
     - Left: Grouped input form (Demographics, Body Measurements, Blood Pressure, Clinical Labs & Lifestyle).
     - Right: Sticky results report with SVG circular probability gauge, Low/Moderate/High risk badge, dynamic recommendations list, and Reset button.
3. **Data Insights (`/insights`)**:
   - Dataset breakdown, feature reference dictionary, interactive Chart.js visualizations (Feature Importance weight, Blood pressure distribution), and model accuracy metrics (87.2% test accuracy, confusion matrix).
4. **About (`/about`)**:
   - Project mission, medical disclaimer, model methodology, and developer profile card (**Mahek Patel**).

---

## 3. Technology Stack & Design System

- **Backend**: FastAPI, Pydantic, Python 3, Uvicorn, Scikit-Learn, Joblib, Pandas.
- **Frontend**: Plain HTML5, CSS3, JavaScript (Vanilla ES6), Tailwind CSS CDN, FontAwesome, Chart.js.
- **Theme Support**: Persistent Light & Dark mode theme switcher with `localStorage` memory and smooth transitions.

---

## 4. How to Deploy and Run

### 1. Install Dependencies
```bash
pip install fastapi uvicorn pandas joblib scikit-learn jinja2
```

### 2. Launch FastAPI Server
```bash
python app.py
```

### 3. Open in Browser
Open `http://127.0.0.1:8000` to access the application.

---

## 5. Developer & Credits

Designed & Developed by **Mahek Patel**.
