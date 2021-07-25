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

## Benchmarks

Using a GCP Cloud Shell Instance, a function with the task of repeating the ``name`` query parameter with an exclamation mark it performed as follows:

- Using a single worker process: ``4500-5000`` requests per second at a latency of ``50ms``.
- Using four worker processes: ``5500-6000`` requests per second at a latency of ``4-8ms``.

Using the same function with 1 worker we can achieve ``1000`` simultaneous connections doing ``200,000`` requests with a latency of about ``100ms`` and ``5600rps``. 