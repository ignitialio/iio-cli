#!/bin/sh
      
export MONGODB_URI=iiomc1-hvphm.gcp.mongodb.net
export MONGODB_USER=ignitial
export MONGODB_OPTIONS=retryWrites=true
export MONGODB_DBNAME=toto

./tools/populate_db-mongo.js

