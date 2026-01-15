"""
File handling utilities for NearMeet.
"""
import os
import uuid
from fastapi import UploadFile, HTTPException
from typing import Optional
import aiofiles
from pathlib import Path


class FileHandler:
    """Handles file upload, storage, and retrieval."""

    def __init__(self, upload_dir: str = "./uploads", max_size: int = 52428800):
        self.upload_dir = Path(upload_dir)
        self.max_size = max_size  # 50MB default
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(self, file: UploadFile, user_id: int) -> dict:
        """
        Save uploaded file to disk.
        
        Returns:
            dict with filename, filepath, size, and mime_type
        """
        # Validate file size
        content = await file.read()
        file_size = len(content)
        
        if file_size > self.max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {self.max_size / 1024 / 1024}MB"
            )
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Create user directory
        user_dir = self.upload_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file
        filepath = user_dir / unique_filename
        async with aiofiles.open(filepath, 'wb') as f:
            await f.write(content)
        
        return {
            "filename": unique_filename,
            "original_filename": file.filename,
            "filepath": str(filepath),
            "size": file_size,
            "mime_type": file.content_type or "application/octet-stream"
        }

    def get_file_path(self, filename: str, user_id: int) -> Optional[Path]:
        """Get the full path to a file."""
        filepath = self.upload_dir / str(user_id) / filename
        if filepath.exists():
            return filepath
        return None

    def delete_file(self, filename: str, user_id: int) -> bool:
        """Delete a file from storage."""
        filepath = self.get_file_path(filename, user_id)
        if filepath and filepath.exists():
            filepath.unlink()
            return True
        return False

    def get_file_info(self, filepath: Path) -> dict:
        """Get file information."""
        if not filepath.exists():
            return None
        
        stat = filepath.stat()
        return {
            "size": stat.st_size,
            "created": stat.st_ctime,
            "modified": stat.st_mtime
        }


# Global file handler instance
file_handler = FileHandler()
