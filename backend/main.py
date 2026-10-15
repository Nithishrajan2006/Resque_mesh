"""
ResQMesh Backend - Main Application Entry Point
Offline-first disaster response coordination platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.database import init_db
from app.routers import incidents, tasks, inventory, peers, sync, audit, agents, demo
from app.routers.ws import router as ws_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("resqmesh")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 ResQMesh backend starting up...")
    init_db()
    logger.info("✅ Database initialized")
    yield
    logger.info("👋 ResQMesh backend shutting down...")


app = FastAPI(
    title="ResQMesh API",
    description="Offline-first decentralized disaster response coordination platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(peers.router, prefix="/api/peers", tags=["Peers"])
app.include_router(sync.router, prefix="/api/sync", tags=["Sync"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(demo.router, prefix="/api/demo", tags=["Demo"])
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "service": "ResQMesh Backend API",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "frontend_app": "https://resquemesh-git-main-team-electron.vercel.app",
        "version": "1.0.0",
        "mode": "offline-first-mesh"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "ResQMesh",
        "version": "1.0.0",
        "mode": "offline-first"
    }


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
