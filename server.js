require('dotenv').config()

var express = require("express");

var app =  express();

// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('view cache', false);
app.use('/public/images/', express.static('./public/images'));
app.use(express.static('node_modules'))
var bodyParser=require("body-parser"); 
app.use(bodyParser.urlencoded({
  extended: true
}));

const { Client, Query } = require('pg')
var conString = "postgres://"+process.env.DB_USER+":"+process.env.DB_PASS+"@"+process.env.DB_HOST+"/"+process.env.DB_TABLE; // Your Database Connection

var variableDefault= '"GPS technology"'
var bounds = [-90,47, -70, 52]
var zoom = 4
var clat = 50
var clng = -100
//var initquery = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.cdname, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, ecumene As agg, censusdistricts As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Intersects(agg.geom, lg.geom) AND  GROUP BY agg.cdname, agg.geom) As f )  As fc;"
//var q = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.cdname, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, ecumene As agg, censusdistricts As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Intersects(agg.geom, lg.geom) AND agg.geom && ST_MakeEnvelope("+minLon+", "+minLat+", "+maxLon+", "+maxLat+", 4326) GROUP BY agg.cdname, agg.geom) As f )  As fc;"
//[bounds.getSouthWest().lng, bounds.getSouthWest().lat, bounds.getNorthEast().lng, bounds.getNorthEast().lat]


app.get('/', function (req, res) {
	var db_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.the_geom)::json As geometry, row_to_json((name, 'default')) As properties FROM data_collector As lg) As f) As fc";
	 var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(db_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        var result = result.rows[0].row_to_json;
    	res.render('index', { 
          bounds: bounds, clat:clat, clng:clng, data:result, zoom: zoom, variable: variableDefault
        });
    });

});


app.post('/data', function( req, res, next ) {
  	var ecumene = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.cdname, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, ecumene As agg, cds As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Intersects(agg.geom, lg.geom) AND agg.geom && ST_MakeEnvelope("+req.body.minLon+", "+req.body.minLat+", "+req.body.maxLon+", "+req.body.maxLat+", 4326) GROUP BY agg.cdname, agg.geom) As f )  As fc;" //ecumene
  	var canada = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.name, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, canada As agg, cds As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Contains(agg.geom, lg.geom) GROUP BY agg.name, agg.geom) As f )  As fc;" //AND agg.geom && ST_MakeEnvelope("+req.body.minLon+", "+req.body.minLat+", "+req.body.maxLon+", "+req.body.maxLat+", 4326) //Canada
  	var cds = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.cdname, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, cds As agg WHERE db.id = agg.ccsuid AND db."+'"totalFarms2016"'+" > 0  AND agg.geom && ST_MakeEnvelope("+req.body.minLon+", "+req.body.minLat+", "+req.body.maxLon+", "+req.body.maxLat+", 4326)GROUP BY agg.cdname, agg.geom) As f )  As fc;"

  	if (parseInt(req.body.zoom) <= 7 & parseInt(req.body.zoom) > 5){
      var question = ecumene
    } else if (parseInt(req.body.zoom) <= 5) {
      var question = canada
    } else if (parseInt(req.body.zoom) >7) {
      var question = cds
    }

	var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(question));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        var result = result.rows[0].row_to_json;
        res.send(result)
        //res.render('index', { 
    		//value1: 'A', value2: 4, value3: 'C', value4: 'D', bounds: bounds, clat: req.body.clat, clng:req.body.clng, data: result, zoom:req.body.zoom
		    //});
    });
    query.on("error", function(error){
      console.log(error)
    })
    
});

app.post('/send', function( req, res, next ) {
	for (i=0; i< req.body.shape.features.length; i++){
		var shape = JSON.stringify(req.body.shape.features[i].geometry)
    var name = "test"+Math.random().toString()
    //need to separate points and polys
		var insertion = "INSERT INTO data_collector (the_geom, name) VALUES (ST_SetSRID(ST_GeomFromGeoJSON('"+shape+"'),4326),'"+name+"')"
		var client = new Client(conString);
	    var result=""
	    client.connect();
	    var query = client.query(new Query(insertion))
	    query.on("row", function (row, result) {
        	result.addRow(row);
    	});
	    query.on("end", function (result) {
	    	//result = result.rows[0].row_to_json
	    	console.log(result)
	    });
	}
})

app.listen(64739);
console.log('64739 is the magic port');