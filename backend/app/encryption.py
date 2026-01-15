"""
Encryption utilities for secure message storage.
"""
from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv
import base64

load_dotenv()


class EncryptionManager:
    """Manages message encryption and decryption."""

    def __init__(self):
        # Get encryption key from environment or generate one
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            # Generate a new key (for development only)
            key = Fernet.generate_key().decode()
            print(f"Generated new encryption key: {key}")
            print("Add this to your .env file as ENCRYPTION_KEY")
        else:
            key = key.encode() if isinstance(key, str) else key
        
        self.cipher = Fernet(key)

    def encrypt(self, message: str) -> str:
        """Encrypt a message."""
        if not message:
            return message
        
        encrypted = self.cipher.encrypt(message.encode())
        return base64.b64encode(encrypted).decode()

    def decrypt(self, encrypted_message: str) -> str:
        """Decrypt a message."""
        if not encrypted_message:
            return encrypted_message
        
        try:
            decoded = base64.b64decode(encrypted_message.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return encrypted_message


# Global encryption manager instance
encryption_manager = EncryptionManager()
