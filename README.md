[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/bsnk-dev/boltz-engine)

<p align="center">
  <a href="https://github.com/bsnk-dev/boltz-engine">
    <img src="https://raw.githubusercontent.com/bsnk-dev/boltz-engine/master/logo.png" alt="Logo" width="120" height="120">
  </a>

  <h3 align="center">Boltz Engine</h3>

  <p align="center">
    A fast Node.js microservices engine for running cloud functions with low latency. Admin dashboard included.
    <br />
    <a href="https://boltz.bsnk.dev"><strong>Explore the docs »</strong></a>
    <br />
    <a href="https://github.com/bsnk-dev/boltz-engine/issues">Report Bug</a>
    ·
    <a href="https://github.com/bsnk-dev/boltz-engine/issues">Request Feature</a>
  </p>
</p>

### What it is
The Boltz Engine is a fast and clustered Node.js microservices engine, starting instances from a cold start in 100ms, and subsequent interactions with functions fall under 10ms under normal conditions. V8 VM instances are used to seperate contexts and allow you to architect your code as self-hosted microservices interoperable with cloud based services. Multithreading means your instances are scaled across the the entire cluster over all your CPU cores. An admin api allows you to manage Boltz from the included admin interface.

### Installation
Download from the releases page and then run the start.sh or start.bat file to install and run Boltz.

Or pull from `bsnk/boltz-engine` on Docker Hub and setup the following steps:

1. Create a config.json and secrets.json -- you can download these from a release on the releases page
2. Place them in a folder, here would be ``boltz-data``
3. Run the docker image with 
```
    $ docker run \
    --publish 5000:5000 \
    --publish 8000:8000 \
    -v /boltz-data:/boltz \
    -v /boltz-data:/secrets/ \
    -v /boltz-data:/database \
    -v /boltz-data/sandbox:/sandbox/ \
    bsnk/boltz-engine:latest
```

You can change these folders to fit your liking and customize the ports it uses in config.json and in the start command. You should probably also use a version of boltz like ``1.1.0`` instead of latest to make sure bugs don't appear in production. /boltz is where it will look for the config.json file inside of the container, and the rest can be customized according to the documentation.

### VMs and Volumes
Boltz let's you create VM instances to recieve and process web requests, and volumes to store code, configurations, and let you save data to a virtual disk temporarily. **All changes are cleared when the instance or volume needs to be reloaded.**

### Node Modules
Packages are loaded from the package.json and installed in sandboxed folders on the host filesystem, they are shared
with any instances using the same volume on the same process.

### Why should you use it?

Recommended use of the Boltz Engine is for simple microservices projects that can later be scaled with a proper cloud product. It has a low overhead and learning curve, allowing you to focus on functionality of your project and not setting it up to run on a cloud platform when it is light enough to handle locally. It's also super fast, giving results on your local machine in under 10ms, instead of thounsands of milliseconds on normal cloud functions. Plus it's easy to use with the included admin interface.

## Problems

The Boltz engine has a few problems, including:

- Large package install size because of the implementation of indivdual volume node_modules sandboxes.
- The admin API uses basic auth, which means you have to restart the server to change the password.

## Benchmarks

Using a GCP Cloud Shell Instance, a function was tasked of repeating the ``name`` query parameter with an exclamation mark, and it performed as follows:

- Using a single worker process: ``4500-5000`` requests per second at a latency of ``50ms``.
- Using four worker processes: ``5500-6000`` requests per second at a latency of ``4-8ms``.

Using the same function with 1 worker we can achieve ``1000`` simultaneous connections doing ``200,000`` requests with a latency of about ``100ms`` and ``5600rps``. 

## Contributing

Boltz is accepting pull requests to improve the engine or the web interface, located in the web repo [here](https://github.com/bsnk-dev/boltz-web). It uses typescript with the Google eslint ruleset, so try to remain consistent, and keep it performant.

## Distribution

When you are ready to distribute your changes, you need to make sure to have the web files under the `public` directory, otherwise, just run the web interface in development mode alongside the engine.

## License

Copyright 2021 bsnk-dev

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
