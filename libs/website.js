
var fs = require('fs');
var path = require('path');

var express = require('express');
var compress = require('compression');

var api = require('./api.js');

module.exports = function(logger){

    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);

    var websiteConfig = portalConfig.website;

    var portalApi = new api(logger, portalConfig, poolConfigs);
    var portalStats = portalApi.stats;

    var logSystem = 'API';
    
    portalStats.getGlobalStats(function(){

    });

    var buildUpdatedWebsite = function(){
        portalStats.getGlobalStats(function(){

            var statData = 'data: ' + JSON.stringify(portalStats.stats) + '\n\n';
            for (var uid in portalApi.liveStatConnections){
                var res = portalApi.liveStatConnections[uid];
                res.write(statData);
            }

        });
    };

    setInterval(buildUpdatedWebsite, websiteConfig.stats.updateInterval * 1000);

    var app = express();
   
    app.get('/get_page', function(req, res, next){
        next();
    });
    
    app.get('/api/:method', function(req, res, next){
        portalApi.handleApiRequest(req, res, next);
    });
    
    app.use(compress());

    app.use(function(err, req, res, next){
        console.error(err.stack);
        res.send(500, 'Something broke!');
    });

    try {
        app.listen(portalConfig.website.port, portalConfig.website.host, function () {
            logger.debug(logSystem, 'Server', 'Api started on ' + portalConfig.website.host + ':' + portalConfig.website.port);
        });
    }
    catch(e){
        logger.error(logSystem, 'Server', 'Could not start api on ' + portalConfig.website.host + ':' + portalConfig.website.port
            +  ' - its either in use or you do not have permission');
    }


};
