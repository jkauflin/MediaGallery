/*==============================================================================
(C) Copyright 2020 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION:  Test framework web server for the MediaGallery library
-----------------------------------------------------------------------------
Modification History
2020-03-20 JJK  Initial version
=============================================================================*/

// Create a web server
const http = require('http');
const url = require('url');
const express = require('express');
var app = express();
var httpServer = http.createServer(app);

app.use('/',express.static('public'));

// jjk new
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

// Have the web server listen for requests
httpServer.listen(3000,function() {
    console.log("Live at Port 3000 - Let's rock!");
});

