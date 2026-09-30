import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine, get_db
from .s3_utils import upload_file_to_s3, delete_file_from_s3, S3_VIDEOS_BUCKET, S3_THUMBS_BUCKET

# Crear las tablas en la base de datos automáticamente si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Plataforma de Videos API",
    version="1.0.0",
    docs_url="/docs"
)

# Permitir peticiones CORS desde cualquier origen (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "API de la Plataforma de Videos activa"}


# ==========================================
# 1. USUARIOS & AUTENTICACIÓN
# ==========================================

@app.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=user.password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login")
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or user.password_hash != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    return {
        "message": "Inicio de sesión exitoso",
        "user_id": user.id,
        "name": user.name,
        "email": user.email
    }


@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


# ==========================================
# 2. VIDEOS (CRUD + S3)
# ==========================================

@app.post("/videos", response_model=schemas.VideoResponse, status_code=status.HTTP_201_CREATED)
def upload_video(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    user_id: int = Form(...),
    video_file: UploadFile = File(...),
    thumbnail_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validaciones de extensión
    if not video_file.filename.lower().endswith(".mp4"):
        raise HTTPException(status_code=400, detail="El video debe ser en formato MP4")
    
    if not thumbnail_file.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="La miniatura debe ser JPG, JPEG o PNG")

    # Subida a Amazon S3
    video_url = upload_file_to_s3(video_file, S3_VIDEOS_BUCKET)
    thumbnail_url = upload_file_to_s3(thumbnail_file, S3_THUMBS_BUCKET)

    # Registro en BD
    new_video = models.Video(
        title=title,
        description=description,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        user_id=user_id,
        views=0
    )
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    return new_video


@app.get("/videos", response_model=List[schemas.VideoResponse])
def get_videos(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Video)
    if user_id:
        query = query.filter(models.Video.user_id == user_id)
    return query.all()


@app.get("/videos/{video_id}", response_model=schemas.VideoResponse)
def get_video_by_id(video_id: int, db: Session = Depends(get_db)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    # Incrementar vistas
    video.views += 1
    db.commit()
    db.refresh(video)
    return video


@app.put("/videos/{video_id}", response_model=schemas.VideoResponse)
def update_video(
    video_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")

    if title:
        video.title = title
    if description is not None:
        video.description = description

    db.commit()
    db.refresh(video)
    return video


@app.delete("/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")

    # Eliminar archivos asociados de S3
    delete_file_from_s3(video.video_url, S3_VIDEOS_BUCKET)
    delete_file_from_s3(video.thumbnail_url, S3_THUMBS_BUCKET)

    # Eliminar comentarios y el registro del video en BD
    db.query(models.Comment).filter(models.Comment.video_id == video_id).delete()
    db.delete(video)
    db.commit()
    return None


# ==========================================
# 3. COMENTARIOS
# ==========================================

@app.post("/videos/{video_id}/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    video_id: int,
    comment_data: schemas.CommentCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")

    new_comment = models.Comment(
        content=comment_data.content,
        video_id=video_id,
        user_id=user_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@app.get("/videos/{video_id}/comments", response_model=List[schemas.CommentResponse])
def get_video_comments(video_id: int, db: Session = Depends(get_db)):
    comments = db.query(models.Comment).filter(models.Comment.video_id == video_id).all()
    
    result = []
    for comment in comments:
        user_name = comment.user.name if comment.user else "Anónimo"
        result.append(
            schemas.CommentResponse(
                id=comment.id,
                content=comment.content,
                created_at=comment.created_at,
                user_id=comment.user_id,
                user_name=user_name
            )
        )
    return result