#!/usr/bin/env python3
import os
import sys
import subprocess
import signal
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    ai_analyser_dir = os.path.join(root_dir, "ai_analyser")
    backend_dir = os.path.join(ai_analyser_dir, "backend")
    frontend_dir = os.path.join(ai_analyser_dir, "frontend")

    venv_python = os.path.join(os.path.dirname(root_dir), "venv", "bin", "python3")
    python_cmd = venv_python if os.path.exists(venv_python) else sys.executable

    print("\n" + "="*60)
    print("🚀 Launching FusionX Core System (AI Analyser + Personal Finance)...")
    print("="*60)

    # 1. Start Backend
    print("⚡ [1/2] Starting Backend API Server (Port 8001)...")
    backend_proc = subprocess.Popen([python_cmd, "main.py"], cwd=backend_dir)

    time.sleep(1.5)

    # 2. Start Frontend Vite
    print("🌐 [2/2] Starting Frontend UI (Port 5173)...")
    frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir)

    print("\n" + "="*60)
    print("✅ FusionX System Successfully Running!")
    print("👉 Access Dashboard: http://localhost:5173/")
    print("⚡ Press Ctrl+C anytime to stop both servers.")
    print("="*60 + "\n")

    def signal_handler(sig, frame):
        print("\n🛑 Stopping FusionX services...")
        try:
            backend_proc.terminate()
            frontend_proc.terminate()
        except:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
