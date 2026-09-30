import os
import boto3
from botocore.exceptions import NoCredentialsError
from fastapi import HTTPException, UploadFile, status

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_VIDEOS_BUCKET = os.getenv("S3_VIDEOS_BUCKET", "tu-bucket-videos")
S3_THUMBS_BUCKET = os.getenv("S3_THUMBS_BUCKET", "tu-bucket-miniaturas")

# Inicializa el cliente S3. En EC2 usará automáticamente el IAM Role asignado.
s3_client = boto3.client("s3", region_name=AWS_REGION)

def upload_file_to_s3(file: UploadFile, bucket_name: str, folder_prefix: str = "") -> str:
    """Sube un archivo a un bucket de S3 y retorna su URL pública."""
    try:
        file_key = f"{folder_prefix}{file.filename}" if folder_prefix else file.filename
        
        # Subir el archivo asignando ContentType adecuado
        s3_client.upload_fileobj(
            file.file,
            bucket_name,
            file_key,
            ExtraArgs={"ContentType": file.content_type}
        )
        
        # Generar la URL pública estática del archivo
        file_url = f"https://{bucket_name}.s3.{AWS_REGION}.amazonaws.com/{file_key}"
        return file_url

    except NoCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Credenciales de AWS no encontradas o IAM Role no configurado"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir archivo a S3: {str(e)}"
        )

def delete_file_from_s3(file_url: str, bucket_name: str):
    """Elimina un archivo de S3 a partir de su URL pública."""
    try:
        file_key = file_url.split("/")[-1]
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
    except Exception as e:
        print(f"Error al eliminar archivo de S3: {str(e)}")