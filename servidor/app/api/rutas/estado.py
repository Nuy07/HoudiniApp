from fastapi import APIRouter

router = APIRouter(tags=["Estado"])


@router.get("/estado")
def estado():
    return {"app": "HoudiniApp"}
