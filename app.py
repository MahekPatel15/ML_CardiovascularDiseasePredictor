import os
import time
import logging
from collections import defaultdict
from typing import Dict, List

import joblib
import pandas as pd
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator

# Configure logging securely (avoid logging PII/sensitive request data)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cardio_backend")

app = FastAPI(
    title="Cardiovascular Disease Prediction API",
    description="Secure REST API for predicting cardiovascular disease risk.",
    version="1.0.0"
)

# CORS Policy - strictly configured for local and deployed environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Resolve model, scaler, and template paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Load model and scaler
try:
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        raise FileNotFoundError("Required pickle files (model.pkl, scaler.pkl) not found in workspace.")
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    logger.info("Machine learning model and scaler successfully loaded.")
except Exception as e:
    logger.critical(f"Initialization failure: {str(e)}")
    raise RuntimeError(f"Could not load ML assets: {str(e)}")


# ----------------------------------------------------
# SECURITY: In-Memory Token Bucket / Rate Limiter
# ----------------------------------------------------
class SimpleIPRateLimiter:
    """
    Self-contained, in-memory rate limiter to protect against brute-force and DDoS.
    Limits each client IP to a set number of requests within a sliding window.
    """
    def __init__(self, requests_limit: int = 30, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history: Dict[str, List[float]] = defaultdict(list)

    def check_limit(self, ip: str) -> bool:
        now = time.time()
        self.history[ip] = [t for t in self.history[ip] if now - t < self.window_seconds]
        if len(self.history[ip]) >= self.requests_limit:
            return False
        self.history[ip].append(now)
        return True

ip_limiter = SimpleIPRateLimiter(requests_limit=30, window_seconds=60)

async def rate_limit_check(request: Request):
    """
    Rate limiter dependency extracting client IP with X-Forwarded-For support.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif request.client and request.client.host:
        client_ip = request.client.host
    else:
        client_ip = "127.0.0.1"

    if not ip_limiter.check_limit(client_ip):
        logger.warning(f"Rate limit exceeded for client IP: {client_ip}")
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Too many requests. Please try again in a minute."
        )


# ----------------------------------------------------
# SECURITY: Global Error Handlers (OWASP Non-Revealing)
# ----------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Sanitizes Pydantic validation errors into clean strings preventing stack exposure.
    """
    error_messages = []
    for err in exc.errors():
        loc = err.get("loc", ())
        field = " -> ".join(str(item) for item in loc if item != "body")
        msg = err.get("msg", "Validation error")
        error_messages.append(f"{field}: {msg}" if field else msg)

    clean_message = "; ".join(error_messages) or "Invalid input data supplied."
    logger.warning(f"Validation rejection on {request.url.path}: {clean_message}")
    return JSONResponse(
        status_code=422,
        content={"detail": clean_message}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global safety net catching unhandled exceptions and returning safe messages.
    """
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )


# ----------------------------------------------------
# VERCEL SERVERLESS PATH NORMALIZATION MIDDLEWARE
# ----------------------------------------------------
@app.middleware("http")
async def vercel_prefix_middleware(request: Request, call_next):
    """
    Normalizes path prefixes automatically when deployed behind Vercel serverless rewrites.
    Guarantees seamless routing for both / and /api prefixed routes.
    """
    path = request.scope.get("path", "")
    if path == "/api" or path == "/api/":
        request.scope["path"] = "/"
    elif path.startswith("/api/api/"):
        request.scope["path"] = path[4:]
    response = await call_next(request)
    return response


# ----------------------------------------------------
# SECURITY: Zero Trust Input Sanitization & Validation
# ----------------------------------------------------
class PredictionRequest(BaseModel):
    gender: int = Field(..., description="Gender (1: Female, 2: Male)")
    height: float = Field(..., description="Height in cm (100 to 220)")
    weight: float = Field(..., description="Weight in kg (30 to 200)")
    ap_hi: int = Field(..., description="Systolic Blood Pressure (60 to 250 mmHg)")
    ap_lo: int = Field(..., description="Diastolic Blood Pressure (40 to 200 mmHg)")
    cholesterol: int = Field(..., description="Cholesterol level (1: normal, 2: above normal, 3: well above normal)")
    gluc: int = Field(..., description="Glucose level (1: normal, 2: above normal, 3: well above normal)")
    smoke: int = Field(..., description="Smoking status (0: No, 1: Yes)")
    alco: int = Field(..., description="Alcohol consumption (0: No, 1: Yes)")
    active: int = Field(..., description="Physical activity (0: No, 1: Yes)")
    age_years: int = Field(..., description="Age in years (18 to 100)")

    @field_validator('gender')
    def validate_gender(cls, v):
        if v not in (1, 2):
            raise ValueError("Gender must be 1 (Female) or 2 (Male).")
        return v

    @field_validator('height')
    def validate_height(cls, v):
        if not (100.0 <= v <= 220.0):
            raise ValueError("Height must be between 100 and 220 cm.")
        return v

    @field_validator('weight')
    def validate_weight(cls, v):
        if not (30.0 <= v <= 200.0):
            raise ValueError("Weight must be between 30 and 200 kg.")
        return v

    @field_validator('ap_hi')
    def validate_ap_hi(cls, v):
        if not (60 <= v <= 250):
            raise ValueError("Systolic blood pressure must be between 60 and 250 mmHg.")
        return v

    @field_validator('ap_lo')
    def validate_ap_lo(cls, v):
        if not (40 <= v <= 200):
            raise ValueError("Diastolic blood pressure must be between 40 and 200 mmHg.")
        return v

    @field_validator('cholesterol', 'gluc')
    def validate_categorical_indicators(cls, v):
        if v not in (1, 2, 3):
            raise ValueError("Cholesterol and Glucose levels must be 1 (Normal), 2 (Above Normal), or 3 (Well Above Normal).")
        return v

    @field_validator('smoke', 'alco', 'active')
    def validate_binary_flags(cls, v):
        if v not in (0, 1):
            raise ValueError("Binary behavioral flags (smoke, alco, active) must be 0 or 1.")
        return v

    @field_validator('age_years')
    def validate_age(cls, v):
        if not (18 <= v <= 100):
            raise ValueError("Age must be between 18 and 100 years.")
        return v

    @model_validator(mode="after")
    def check_bp_relation(self) -> 'PredictionRequest':
        if self.ap_hi < self.ap_lo:
            raise ValueError("Systolic blood pressure (ap_hi) cannot be lower than Diastolic blood pressure (ap_lo).")
        return self


class PredictionResponse(BaseModel):
    cardio_risk: int = Field(..., description="Cardiovascular disease prediction (0: low risk, 1: high risk)")
    risk_probability: float = Field(..., description="Confidence probability score (0.0 to 1.0)")


# ----------------------------------------------------
# REST API Endpoints (Direct and Vercel-Aliased)
# ----------------------------------------------------
@app.post(
    "/api/predict",
    response_model=PredictionResponse,
    dependencies=[Depends(rate_limit_check)],
    summary="Calculate Cardiovascular Disease Risk",
    description="Processes physical and clinical features to predict probability of cardiovascular disease using the Decision Tree model."
)
@app.post("/predict", response_model=PredictionResponse, dependencies=[Depends(rate_limit_check)], include_in_schema=False)
@app.post("/api/api/predict", response_model=PredictionResponse, dependencies=[Depends(rate_limit_check)], include_in_schema=False)
async def predict_cardio(data: PredictionRequest):
    try:
        feature_order = [
            "gender", "height", "weight", "ap_hi", "ap_lo",
            "cholesterol", "gluc", "smoke", "alco", "active", "age_years"
        ]
        
        input_data = pd.DataFrame(
            [[
                data.gender,
                data.height,
                data.weight,
                data.ap_hi,
                data.ap_lo,
                data.cholesterol,
                data.gluc,
                data.smoke,
                data.alco,
                data.active,
                data.age_years
            ]],
            columns=feature_order
        )

        scaled_features = scaler.transform(input_data)
        prediction = int(model.predict(scaled_features)[0])
        probabilities = model.predict_proba(scaled_features)[0]
        risk_probability = float(probabilities[1])

        return PredictionResponse(
            cardio_risk=prediction,
            risk_probability=round(risk_probability, 4)
        )

    except Exception as e:
        logger.error(f"Internal prediction error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred on the server while processing model predictions."
        )


@app.get("/health", summary="API Health Check")
@app.get("/api/health", include_in_schema=False)
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}


# ----------------------------------------------------
# FRONTEND HTML PAGE ROUTES (With Vercel /api aliases)
# ----------------------------------------------------
@app.get("/", response_class=HTMLResponse, summary="Home Page")
@app.get("/api", response_class=HTMLResponse, include_in_schema=False)
@app.get("/api/", response_class=HTMLResponse, include_in_schema=False)
async def page_home(request: Request):
    return templates.TemplateResponse(request, "index.html", {"active_page": "home"})


@app.get("/predictor", response_class=HTMLResponse, summary="Risk Predictor Page")
@app.get("/api/predictor", response_class=HTMLResponse, include_in_schema=False)
async def page_predictor(request: Request):
    return templates.TemplateResponse(request, "predictor.html", {"active_page": "predictor"})


@app.get("/insights", response_class=HTMLResponse, summary="Data Insights Page")
@app.get("/api/insights", response_class=HTMLResponse, include_in_schema=False)
async def page_insights(request: Request):
    return templates.TemplateResponse(request, "insights.html", {"active_page": "insights"})


@app.get("/about", response_class=HTMLResponse, summary="About & Documentation Page")
@app.get("/api/about", response_class=HTMLResponse, include_in_schema=False)
async def page_about(request: Request):
    return templates.TemplateResponse(request, "about.html", {"active_page": "about"})


# ----------------------------------------------------
# STATIC ASSETS MOUNTING
# ----------------------------------------------------
static_dir = os.path.join(BASE_DIR, "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")
app.mount("/api/static", StaticFiles(directory=static_dir), name="api_static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
