/*==============================================================================
(C) Copyright 2020 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION:  Test framework web server for the MediaGallery library
-----------------------------------------------------------------------------
Modification History
2020-03-20 JJK  Initial version
2020-03-22 JJK  Working on FTP and createThumbnails call
=============================================================================*/
// Read environment variables from the .env file
require('dotenv').config();

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
    console.log("UncaughtException, error = " + e);
    console.error(e.stack);
    // Stop the process
    // 2017-12-29 JJK - Don't stop for now, just log the error
    //process.exit(1);
});

const https = require('https');
//var getJSON = require('get-json');
//const url = require('url');
var dateTime = require('node-datetime');

var Client = require('ftp');
var fs = require('fs');

var ftpConfig = {
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS
}

var ftpClient = new Client();
ftpClient.on('ready', function () {
    console.log("FTP ready");

    /*
    ftpClient.list('public_html/Media/', function (err, list) {
        if (err) throw err;
        list.map(function (entry) {
            console.log("entry.name = "+entry.name);
        });
        ftpClient.end();
    });
    */

    /*
    ftpClient.put('foo.txt', 'foo.remote-copy.txt', function (err) {
        if (err) throw err;
        ftpClient.end();
    });
    */

});

ftpClient.connect(ftpConfig);

/*
const http = require('http');
const express = require('express');
var app = express();
var httpServer = http.createServer(app);
app.use('/',express.static('public'));
app.use("*", function (req, res) {
    console.log("Not in Public, URL = " + req.url);
    res.sendFile(path + "404.html");
});
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})
// Have the web server listen for requests
httpServer.listen(3000, function () {
    console.log("Live at Port 3000 - Let's rock!");
});
*/

// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function (dir, filelist) {
    var path = path || require('path');
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            //filelist = walkSync(path.join(dir, file), filelist);
            filelist.push(path.join(dir, file));
        } else {
            // check for image file first???
            //filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

var dir = process.env.PHOTOS_DIR;
var fileList = walkSync(dir);


for (var i = 0, len = fileList.length; i < len; i++) {
    console.log("fileList[" + i + "] = " + fileList[i]);
}


var backSlashRegExp = new RegExp("\\\\", "g");

// Start recursive function
//createThumbnail(0);

function createThumbnail(index) {
    var fileNameAndPath = fileList[index].substring(3).replace(backSlashRegExp, "/");
    var tempUrl = process.env.BOT_WEB_URL + 'createThumbnail.php?file=' + fileNameAndPath + '&UID=' + process.env.UID;
    //console.log("tempUrl = " + tempUrl);
    //console.log(index + " of " + fileList.length + ", file = " + fileNameAndPath);

    https.get(tempUrl, (resp) => {
        let data = '';
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            //console.log("data = " + data);
            // Maybe return if it created one or not?  and do less time if not created
            console.log(dateTime.create().format('Y-m-d H:M:S ') + index + " of " + fileList.length + ", " + fileNameAndPath + ", " + data);
            var delayMs = 1000;
            if (data == 'Created') {
                delayMs = 2000;
            }
            if (index < fileList.length - 1) {
                setTimeout(createThumbnail, delayMs, index + 1);
            }
        });

    }).on("error", (e) => {
        console.log("Error: " + e.message);
        // Wait 10 seconds and try the same one again
        setTimeout(createThumbnail, 10000, index);
    });

} // function createThumbnail(fileNameAndPath) {
