from firebase_functions import https_fn
from flask import jsonify
from utils.firebase import get_firestore

@https_fn.on_request()
def update_user(req: https_fn.Request) -> https_fn.Response:
    db = get_firestore()

    try:
        data = req.get_json(silent=True)
        user_id = data.get("user_id")
        updates = data.get("updates")

        if not user_id or not updates:
            return https_fn.Response(jsonify({"error": "Missing fields"}), status=400)

        db.collection("users").document(user_id).update(updates)
        return https_fn.Response(jsonify({"message": f"User {user_id} updated"}), status=200)

    except Exception as e:
        return https_fn.Response(jsonify({"error": str(e)}), status=500)
