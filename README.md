# Chicken Society

Play here:

https://chickensociety.net

Development version:

https://alesan99.github.io/chicken_society/

## Starting the server
Install Node.js at https://nodejs.org/en

In VSCode, execute the following command in the project directory:
```
npm ci
```
To start the server, type:
```
node server.js
```
It will be served to http://localhost:3000/

Crtl+C to stop

## Initializing Dependencies
These commands were used to set up node.js for use in the project.
This is NOT required to simply install the project on a new machine.
```
npm init -y
npm install express socket.io socket.io-msgpack-parser express-session json5
```
