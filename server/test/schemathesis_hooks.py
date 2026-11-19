"""Ne pas confondre une salle absente sur écriture avec une machine disparue."""
import requests
import schemathesis


@schemathesis.hook
def filter_failure(context, failure, case, response):
    if failure.code != "ST302" or case.operation.label not in {
        "PUT /machines/{machineId}", "PATCH /machines/{machineId}"
    }:
        return True
    try:
        if response.status_code != 404 or response.json().get("type") != (
            "https://api.mawo.local/problems/salle-introuvable"
        ):
            return True
        # Ne filtrer le diagnostic qu'après preuve que la machine existe :
        # une disparition réelle, une panne ou un autre 404 restent des échecs.
        lecture = requests.get(response.request.url, timeout=5)
        disponible = lecture.status_code == 200 and lecture.json().get("id") == (
            case.path_parameters.get("machineId")
        )
    except (requests.RequestException, ValueError, AttributeError):
        return True
    return not disponible
