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

// Have the web server listen for requests
httpServer.listen(3000,function() {
    console.log("Live at Port 3000 - Let's rock!");
});

app.use("*", function (req, res) {
    console.log("Not in Public, URL = " + req.url);
    res.sendFile(path + "404.html");
});

app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})


// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function (dir, filelist) {
    var path = path || require('path');
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            // check for image file first???
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

var dir = "E:\\test\\1 John J Kauflin\\2016-to-2022\\2019\\05 - Winter";
//var fileList = walkSync(dir);

/*
for (var i = 0, len = fl.length; i < len; i++) {
    console.log("fl[" + i + "] = " + fl[i]);
}
*/

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
