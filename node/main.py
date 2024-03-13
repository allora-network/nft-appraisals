import requests
import os
import sys
import json


UPSHOT_API_TOKEN = os.environ.get("UPSHOT_API_TOKEN")


def get_signed_appraisal(asset_id):
    return f"https://api.upshot.xyz/v2/appraisals/assets/signed?asset_ids={asset_id.lower()}"


def get_asset_appraisal(asset_id, api_key):
    # Get the signed appraisal URL for the asset
    url = get_signed_appraisal(asset_id)

    # Send a GET request to the Upshot API with the signed URL and API key
    response = requests.get(url, headers={"x-api-key": api_key})

    # Check if the request was successful
    if response.status_code != 200:
        return None

    # Parse the response JSON
    res = response.json()

    try:
        # Extract the asset appraisal from the response data
        appraisal = res["data"][0]["price"]
        return f"{appraisal}"
    except Exception as e:
        # Return None if there is an error or no appraisal data available
        return None


def process(asset_id):
    # Get the appraisal value for the asset
    asset_appraisal_wei = get_asset_appraisal(asset_id, UPSHOT_API_TOKEN)

    # Check if the appraisal value exists
    if asset_appraisal_wei:
        # Create a JSON response with the appraisal value
        response = json.dumps({"value": asset_appraisal_wei})
    else:
        # Create a JSON response with an error message
        response = json.dumps({"error": "No predictions"})

    # Print the response
    print(response)


if __name__ == "__main__":
    # Your code logic with the parsed argument goes here
    try:
        asset_id = sys.argv[2]
        process(asset_id)
    except Exception as e:
        response = json.dumps({"error": {str(e)}})
        print(response)
