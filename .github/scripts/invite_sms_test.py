"""Sends the platform admin the app invitation SMS of an example booking (24/11/2026, « essaie de m'envoyer un sms avec le
modèle en cours de validation »): POST /internal/platform/traveller-invite/test, from a parking's own phone, to PHONE or else
PROSPECTING_PHONE. Prints the text sent, never a phone number."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import import_prospects as api  # noqa: E402  (sign-in, calls, sign-out)


def main():
    body = {}
    if os.environ.get("OPERATOR_ID", "").strip():
        body["operatorId"] = os.environ["OPERATOR_ID"].strip()
    if os.environ.get("PHONE", "").strip():
        body["phone"] = os.environ["PHONE"].strip()
    try:
        api.login()
        answer = api.call("POST", "/internal/platform/traveller-invite/test", body)
        summary = ["## SMS d'invitation envoyé", "", f"Depuis le téléphone de **{answer.get('parking')}** "
                   f"({answer.get('outcome')}).", "", "> " + str(answer.get("text", ""))]
        print("\n".join(summary))
        target = os.environ.get("GITHUB_STEP_SUMMARY")
        if target:
            with open(target, "a", encoding="utf-8") as fh:
                fh.write("\n".join(summary) + "\n")
    finally:
        api.logout()


if __name__ == "__main__":
    main()
