#!/bin/bash
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin
node "$(dirname "$0")/check-progress.mjs"
