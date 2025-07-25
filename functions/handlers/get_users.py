from flask import jsonify
from firebase_functions import https_fn
from utils.firebase import get_firestore
import os

IS_LOCAL = os.getenv("FUNCTIONS_EMULATOR") == "true"

@https_fn.on_request()
def get_users(req: https_fn.Request):
    db = get_firestore()
    users = []

    for doc in db.collection("users").stream():
        data = doc.to_dict()
        data["id"] = doc.id
        users.append(data)

    response = jsonify(users)
    response.status_code = 200

    if IS_LOCAL:
        return response  # Flask-compatible for local testing
    else:
        return https_fn.Response(response, status=200, mimetype="application/json")
