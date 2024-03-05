import { json, memory } from "@blockless/sdk/assembly";
import { Console } from "as-wasi/assembly";

function median(numbers: f64[]): f64 {
  const sorted = numbers.sort((a, b) => <i32>(a - b));
  const middle = sorted.length / 2;
  return sorted.length % 2 !== 0
    ? sorted[<i32>Math.floor(middle)]
    : (sorted[middle - 1] + sorted[middle]) / 2.0;
}

// Function to process the JSON and compute normalized weights
export function processJson(jsonData: string): void {

  // Step 1: Parse the JSON
  const parsedJson = <json.JSON.Obj>json.JSON.parse(jsonData);
  let inferences = <json.JSON.Arr>parsedJson.getArr('inferences')
  if (!inferences) {
    throw new Error('inferences not found in stdin');
  }
  let latestWeights = <json.JSON.Obj>parsedJson.get("latest_weights");
  if (!latestWeights) {
    throw new Error('weights not found in stdin');
  }

  // Step 2: Build variances and counts maps
  let variances: Map<string, f64> = new Map<string, f64>();
  let counts: Map<string, i32> = new Map<string, i32>();

  // Step 3: Iterate over each timestamp
  for (let i = 0; i < inferences.valueOf().length; i++) {
    const inferenceObject = <json.JSON.Obj>inferences.valueOf()[i];
    if (!inferenceObject) {
        throw new Error('worker not found in inference');
    }
    const timestamp = inferenceObject.get('timestamp')
    if (!timestamp) {
        throw new Error('inference not found in inference');
    }
    let workerData = inferenceObject.getArr("inferences");
    if (!workerData) {
        throw new Error('No worker Data found in inference');
    }
    let inferencesArray: f64[] = [];
    for (let j = 0; j < workerData.valueOf().length; j++) {
        // get inference data on inferencesArray
        let inference = <json.JSON.Obj>workerData.valueOf()[j];
        if (!inference) {
        throw new Error('No inference object found');
        }
        let value = inference.get("inference")
        if (!value) {
        throw new Error('No value found in inference');
        }
        let valueF64 = parseFloat(value.toString());
        inferencesArray.push(valueF64);
    }
    // Get median value of the inferences for this batch
    let medianValue = median(inferencesArray);
    
    // Get worker data and compute variance
    for (let j = 0; j < workerData.valueOf().length; j++) {
        let inference = <json.JSON.Obj>workerData.valueOf()[j];
        if (!inference) {
            throw new Error('No inference object found');
        }
        let workerNameObj = inference.getString("worker");
        if (!workerNameObj) {
            throw new Error('No workerName value found in inference obj');
        }
        let workerName = workerNameObj.toString()
        let value = inference.getString("inference")
        if (!value) {
            throw new Error('No inference value found in inference obj');
        }
        let workerInference = parseFloat(value.toString());

        let varianceValue = Math.pow(workerInference - medianValue, 2);
        if (variances.has(workerName)) {
            variances.set(workerName, variances.get(workerName) + varianceValue);
            counts.set(workerName, counts.get(workerName) + 1);
        } else {
            variances.set(workerName, varianceValue);
            counts.set(workerName, 1);
        }
    }
    }

    // Setting an avg variance for a new actor, with a correction factor penalty
    let workerCount = variances.keys().length
    let averageVariance = 1.0 / workerCount;
    const correction_factor = 2
    const newWorkerWeight = averageVariance / correction_factor

    // Build normalized weights.
    let normalizedWeights: Map<string, f64> = new Map<string, f64>();
    let totalWeight = 0.0;

    let keys = variances.keys();
    for (let i = 0; i < keys.length; i++) {
      let worker = keys[i];
      let avgVariance = variances.get(worker) / f64(counts.get(worker));
      let latest_weight_worker_weight_str = latestWeights.getString(worker)
      let latestWeight = newWorkerWeight
      if (latest_weight_worker_weight_str) {
        latestWeight = parseFloat(latest_weight_worker_weight_str.toString());
      }
      // Take the reciprocal of the variance
      let normalizedWeight = (1.0 / avgVariance)  * latestWeight;
      normalizedWeights.set(worker, normalizedWeight);
      totalWeight += normalizedWeight;
    };

    // Normalize the total weights to sum up to 1
    keys = normalizedWeights.keys();
    for (let i = 0; i < keys.length; i++) {
      let worker = keys[i];
      let adjustedWeight = normalizedWeights.get(worker) / totalWeight;
      normalizedWeights.set(worker, adjustedWeight);
    }
    
    // Serialize into json. 
    let weightsObj = new json.JSON.Obj();
    weightsObj.set("type", new json.JSON.Str("weights"));
    let weightsInnerObj = new json.JSON.Obj();
    
    keys = normalizedWeights.keys();
    for (let i = 0; i < keys.length; i++) {
        let worker = keys[i];
        let weight = normalizedWeights.get(worker);
        weightsInnerObj.set(worker, new json.JSON.Str(weight.toString()));
    }
    // Print
    weightsObj.set("weights", weightsInnerObj);
    let jsonString = weightsObj.toString();
    Console.log(jsonString);

}


// EXECUTION ----------------------------------------------
let stdin = new memory.Stdin().read().toJSON()
if (stdin) {
  let stdinString = new memory.Stdin().read();
  processJson(stdinString.toString());
}