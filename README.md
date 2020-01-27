# Pine-beetle Automation Server

Automation server for creating pipeline between ArcGIS and MongoDB with human intervention.

# Installation

Download the repo and run `npm install` in the main directory.
Then, depending on your choice, run `node` or `nodemon` (if you want live changes) with `index.js`.

Note: make sure to implement the correct .env file located in the DALI Pine-Beetle slack.

# Server Capabilities

System is linked with ArcGIS System and automatically adds trapping record when a survey result is submitted.
Gathering required data for the trappings table (Clerings and SPB per/day average).
Performing calculations on the obtained information.
Verifying connection with MongoDB by uploading test information.

# Credits

John McCambridge - '22


