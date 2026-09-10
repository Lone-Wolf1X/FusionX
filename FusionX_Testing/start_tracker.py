#!/usr/bin/env python3
import os
import sys
import subprocess

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    
    venv_python = os.path.join(os.path.dirname(root_dir), "venv", "bin", "python3")
    python_cmd = venv_python if os.path.exists(venv_python) else sys.executable

    print(f"🚀 Starting FusionX Private Financial Tracker & Wealth OS...")
    print(f"📂 Root Directory: {root_dir}")
    print(f"🌐 Dashboard URL: http://localhost:8000/")
    print(f"⚡ Press Ctrl+C to stop server.\n")

    os.chdir(backend_dir)
    subprocess.run([python_cmd, "main.py"])

if __name__ == "__main__":
    main()
