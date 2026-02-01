"""
File upload utilities for media management.
Handles validation, storage (local/S3), and image processing.
"""
import os
import uuid
import mimetypes
from typing import Optional, Tuple
from pathlib import Path
from PIL import Image
from fastapi import UploadFile, HTTPException, status
import aiofiles
import boto3
from botocore.exceptions import ClientError

from ..config import settings


class FileUploadManager:
    """
    Manages file uploads with validation and storage.
    Supports both local filesystem and AWS S3 storage.
    """
    
    # File type mappings
    FILE_TYPE_MAP = {
        'image': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'video': ['mp4', 'mov', 'avi', 'webm'],
        'document': ['pdf']
    }
    
    # Max dimensions for images
    MAX_IMAGE_WIDTH = 4096
    MAX_IMAGE_HEIGHT = 4096
    
    # Max video duration (seconds)
    MAX_VIDEO_DURATION = 120
    
    def __init__(self):
        self.use_s3 = settings.USE_S3
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.bucket_name = settings.AWS_S3_BUCKET
    
    async def validate_file(self, file: UploadFile) -> Tuple[str, str]:
        """
        Validate uploaded file.
        
        Args:
            file: Uploaded file
        
        Returns:
            Tuple of (file_type, file_extension)
        
        Raises:
            HTTPException: If file is invalid
        """
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Get file extension
        file_extension = Path(file.filename).suffix.lower().lstrip('.')
        
        if file_extension not in settings.allowed_extensions_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type .{file_extension} is not allowed. Allowed types: {', '.join(settings.allowed_extensions_list)}"
            )
        
        # Determine file type
        file_type = self._get_file_type(file_extension)
        
        return file_type, file_extension
    
    async def save_file(
        self,
        file: UploadFile,
        campaign_id: int
    ) -> Tuple[str, dict]:
        """
        Save file to storage (local or S3).
        
        Args:
            file: Uploaded file
            campaign_id: ID of the campaign
        
        Returns:
            Tuple of (file_path, metadata_dict)
        """
        file_type, file_extension = await self.validate_file(file)
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Create subdirectory for campaign
        relative_path = f"campaign_{campaign_id}/{unique_filename}"
        
        # Read file content
        content = await file.read()
        
        # Get metadata
        metadata = await self._extract_metadata(content, file_type, file_extension)
        
        if self.use_s3:
            # Upload to S3
            file_path = await self._upload_to_s3(relative_path, content, file.content_type)
        else:
            # Save to local filesystem
            file_path = await self._save_to_local(relative_path, content)
        
        metadata['file_size'] = len(content)
        metadata['mime_type'] = file.content_type or mimetypes.guess_type(file.filename)[0]
        
        return file_path, metadata
    
    async def delete_file(self, file_path: str):
        """Delete file from storage."""
        if self.use_s3:
            await self._delete_from_s3(file_path)
        else:
            await self._delete_from_local(file_path)
    
    async def _save_to_local(self, relative_path: str, content: bytes) -> str:
        """Save file to local filesystem."""
        full_path = Path(settings.UPLOAD_DIR) / relative_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiofiles.open(full_path, 'wb') as f:
            await f.write(content)
        
        return str(full_path)
    
    async def _upload_to_s3(self, key: str, content: bytes, content_type: Optional[str] = None) -> str:
        """Upload file to S3."""
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=content,
                **extra_args
            )
            
            # Return S3 URL
            return f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload to S3: {str(e)}"
            )
    
    async def _delete_from_local(self, file_path: str):
        """Delete file from local filesystem."""
        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass
    
    async def _delete_from_s3(self, file_path: str):
        """Delete file from S3."""
        try:
            # Extract key from URL
            key = file_path.split(f"{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/")[1]
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete from S3: {str(e)}"
            )
    
    async def _extract_metadata(
        self,
        content: bytes,
        file_type: str,
        file_extension: str
    ) -> dict:
        """Extract metadata from file content."""
        metadata = {}
        
        if file_type == 'image':
            try:
                from io import BytesIO
                image = Image.open(BytesIO(content))
                metadata['width'] = image.width
                metadata['height'] = image.height
                
                # Validate dimensions
                if image.width > self.MAX_IMAGE_WIDTH or image.height > self.MAX_IMAGE_HEIGHT:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Image dimensions exceed maximum allowed ({self.MAX_IMAGE_WIDTH}x{self.MAX_IMAGE_HEIGHT})"
                    )
            except Exception as e:
                if isinstance(e, HTTPException):
                    raise
                # If can't process image, continue without metadata
                pass
        
        elif file_type == 'video':
            # Video metadata extraction would require ffmpeg or similar
            # For now, we'll skip this and set placeholder values
            metadata['duration'] = None
            metadata['width'] = None
            metadata['height'] = None
        
        return metadata
    
    def _get_file_type(self, extension: str) -> str:
        """Determine file type from extension."""
        for file_type, extensions in self.FILE_TYPE_MAP.items():
            if extension in extensions:
                return file_type
        return 'document'


# Global instance
file_upload_manager = FileUploadManager()
