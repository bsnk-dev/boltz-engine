# Boltz Engine

### What it is
The Boltz Engine is a fast Node.js microservices engine, starting instances from a cold start in 100ms, and subsequent interactions with functions fall under 10ms under normal conditions. V8 VM instances are used to seperate contexts and allow you to architect your code as self-hosted microservices.

### VMs and Volumes
Boltz let's you create VM instances to recieve and process web requests, and volumes to store code, configurations, and let you save data to a virtual disk temporarily. **All data is wiped when the instance or volume needs to be reloaded.**

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

Mac benchmark for instance tasked with repeating your name from the name parameter and adding an exclamation mark:

(This is local, not over a network)

``` 
Max requests:        15000
Concurrency level:   80
Agent:               keepalive

Completed requests:  15000
Total errors:        0
Total time:          4.731024274 s
Requests per second: 3171
Mean latency:        25 ms

Percentage of the requests served within a certain time
  50%      21 ms
  90%      32 ms
  95%      45 ms
  99%      59 ms
100%      103 ms (longest request)```