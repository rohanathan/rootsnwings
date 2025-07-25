import firebase_admin
from firebase_admin import credentials, firestore
import os

def get_firestore():
    if not firebase_admin._apps:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "secrets/rootsnwings-service-key.json")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()
