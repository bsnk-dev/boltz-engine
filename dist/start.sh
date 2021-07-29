#!/bin/bash

# check if node modules are installed
if [ ! -d "node_modules" ]; then
    echo "Installing node modules..."
    npm install
fi

node ./build/src/index.js