# NFT Appraisals worker node 

This is an application packaged for being run on the Allora Network.
It is an example of a setup for running an Allora Network node for providing NFT appraisals.

# Components

* **worker**: The node that will respond to requests from the Allora Network heads.
* **head**: An Allora Network head node. This is not required for running your node in the Allora Network, but it will help for testing your node emulating a network.

When a request is made to the head, it relays this request to a number of workers associated with this head. The request specifies a function to run which will execute a wasm code that will call the `main.py` file in the worker. 
This code will get the NFT appraisal from Upshot API, and returns this value to the `head`, which prepares the response from all of its nodes and sends it back to the requestor.


# docker-compose
A full working example is provided in `docker-compose.yml`.

## Structure
There is a docker-compose.yml provided that sets up one head node and one worker node.

## Dependencies
- Have an available image of the `allora-inference-base` , and reference it as a base on the `FROM` of the `Dockerfile`.
- Create a set of keys in the `keys` directory for your head and worker, and use them in the head and worker configuration(volume mapping already provided in `docker-compose.yml` file). If no keys are specified in the volumes, new keys are created. However, the worker will need to specify the `peer_id` of the head for defining it as a `BOOT_NODES`. You can bring head up first, get the key from the container, then use it in the `BOOT_NODES`. More info in the [b7s-docker-compose](https://github.com/blocklessnetwork/b7s-docker-compose/tree/main) repo.
- Provide a valid `UPSHOT_API_TOKEN` env var inside the `node/.env` file.

## Run 

Once this is set up, run `docker compose up head1 worker1`


Once both nodes are up, a function can be tested by hitting:

```
curl --location 'http://localhost:6000/api/v1/functions/execute' \
--header 'Content-Type: application/json' \
--data '{
    "function_id": "bafybeihvikwjuqtijpurgsyiv5uwmmzg7ksibcwx6s3gjmkneasdn5kndy",
    "method": "nft-appraisals-inference.wasm",
    "parameters": null,
    "topic": "1",
    "config": {
        "env_vars": [
            {
                "name": "BLS_REQUEST_PATH",
                "value": "/api"
            },
            {
                "name": "ALLORA_ARG_PARAMS",
                "value": "0x42069abfe407c60cf4ae4112bedead391dba1cdb/2921"
            },
            {                              
                "name": "TOPIC_ID",
                "value": "1"
            }
        ],
        "number_of_nodes": -1,
        "timeout": 2
    }
}'
```

## Connecting to the Allora network

In order to connect to an Allora network to provide inferences, both the head and the worker need to register against it.
The following optional flags are used in the `command:` section of the `docker-compose.yml` file to define the connectivity with the Allora network.

```
--allora-chain-key-name=nft-appraisals-provider  # your local key name in your keyring
--allora-chain-restore-mnemonic='pet sock excess ...'  # your node's Allora address mnemonic
--allora-node-rpc-address=  # RPC address of a node in the chain
--allora-chain-topic-id=  # The topic id from the chain that you want to provide predictions for
```
In order for the nodes to register with the chain, a funded address is needed first.
If these flags are not provided, the nodes will not register to the appchain and will not attempt to connect to the appchain.


## GitHub actions

### build_push_ecr - Build and push docker images to ECR registry

* Name of the ECR registry is the same as the GitHub repo name.
* The GH action will build a new docker image from PRs and pushes to the main branch.
* **All images** tagged with `$GIT_SHA` and `dev-latest` tags.
* If image built from main branch, then it will also have tagged with `latest` tag.

