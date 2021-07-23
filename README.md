# Boltz Engine

### What it is
The Boltz Engine is a fast Node.js microservices engine, starting instances from a cold start in 100ms, and subsequent interactions with functions fall under 10ms under normal conditions. V8 VM instances are used to seperate contexts and allow you to architect your code as self-hosted microservices.

### VMs and Volumes
Boltz let's you create VM instances to recieve and process web requests, and volumes to store code, configurations, and let you save data to a virtual disk.

### Node Modules
Packages are loaded from the package.json and installed in sandboxed folders on the host filesystem, they are shared
with any instances using the same volume.

### Why should you use it?

Recommended use of the Boltz Engine is for simple microservices projects that can later be scaled with a proper cloud product.

## Problems

The Boltz engine has a few problems, including:

- Minor memory leak regarding cached packages loaded in the host and proxied to instances building up as more volumes are used.
- Cross contamination of packages used in volumes between seperate vm instances.
- Large package install size because of the implementation of indivdual volume node_modules sandboxes.

## Benchmarks for current single process Engine

On an instance tasked with repeating the name query paramter back to the testing client (Windows):
- Gave 15,000 requests.
- Gave 80 concurrent requests max.
- An average latency of 44.3ms.
- 1,788 rps.

You can get this up to 2k rps with a higher concurrency, but latency inceases 3x.
