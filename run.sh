#!/bin/bash
# CardioGuard AI - Local Launch Script
# Automatically selects the Anaconda / virtualenv Python binary with all ML dependencies.

if [ -f "/opt/anaconda3/bin/python3" ]; then
    echo "Starting CardioGuard AI using Anaconda Python 3.13..."
    /opt/anaconda3/bin/python3 app.py
elif command -v python3 &> /dev/null; then
    echo "Starting CardioGuard AI using system python3..."
    python3 app.py
else
    echo "Error: Python 3 not found on system."
    exit 1
fi
