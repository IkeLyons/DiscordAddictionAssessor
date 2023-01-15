Setup Instructions

1. Install npm
2. Install postgresql
3. Install yarn
4. create a config.json with fields:
```
{
  "token": "",
  "clientID": "",
  "guildID": "",
  "dbUser": "",
  "dbHost": "",
  "dbDatabase": "",
  "dbPassword": "",
  "dbPort": ""
}
```
5. yarn install
6. node createDB.js
7. node index.js

Notes:
I currently am running this using pm2 on a raspberry pi