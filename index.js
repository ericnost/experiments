var express = require("express");
var app =  express();

const { Client, Query } = require('pg')

// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('view cache', false);

var bodyParser=require("body-parser"); 

app.use(bodyParser.urlencoded({
  extended: true
}));

var bounds = [-90,45, -70, 50]
var zoom = 10
var clat = 50
var clng = -100
  var minLon = bounds[0]
  var minLat = bounds[1]
  var maxLon = bounds[2]
  var maxLat = bounds[3]
var username = "postgres" // sandbox username
      var password = "postgres18A@!" // read only privileges on our table
      var host = "localhost:5432"
      var database = "agcensus" // database name
      var conString = "postgres://"+username+":"+password+"@"+host+"/"+database; // Your Database Connection
var variableDefault= '"GPS technology"'
var initquery = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.cdname, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, ecumene As agg, censusdistricts As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Intersects(agg.geom, lg.geom) AND  GROUP BY agg.cdname, agg.geom) As f )  As fc;"
var q = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.cdname, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, ecumene As agg, censusdistricts As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Intersects(agg.geom, lg.geom) AND agg.geom && ST_MakeEnvelope("+minLon+", "+minLat+", "+maxLon+", "+maxLat+", 4326) GROUP BY agg.cdname, agg.geom) As f )  As fc;"
//[bounds.getSouthWest().lng, bounds.getSouthWest().lat, bounds.getNorthEast().lng, bounds.getNorthEast().lat]

app.get('/', function (req, res) {
    res.render('index', { 
			  	value1: 'A', value2: 3, value3: 12, value4: req.body.value4, bounds: bounds, clat:clat, clng:clng, data:[], zoom: zoom
			  } );
});

app.post('/', function( req, res, next ) {
  clat = req.body.clat
  clng = req.body.clng
  console.log(req.body.center, clat, clng, minLon, req.body.zoom)
  	var q = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.cdname, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, ecumene As agg, censusdistricts As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Intersects(agg.geom, lg.geom) AND agg.geom && ST_MakeEnvelope("+req.body.minLon+", "+req.body.minLat+", "+req.body.maxLon+", "+req.body.maxLat+", 4326) GROUP BY agg.cdname, agg.geom) As f )  As fc;"
  	 
  	q2 = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.name, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, canada As agg, censusdistricts As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Contains(agg.geom, lg.geom) AND agg.geom && ST_MakeEnvelope("+req.body.minLon+", "+req.body.minLat+", "+req.body.maxLon+", "+req.body.maxLat+", 4326) GROUP BY agg.name, agg.geom) As f )  As fc;" //AND agg.geom && ST_MakeEnvelope("+req.body.minLon+", "+req.body.minLat+", "+req.body.maxLon+", "+req.body.maxLat+", 4326)
  	q3 = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(agg.geom)::json As geometry, row_to_json((agg.cdname, avg(100*(db."+variableDefault+" / db."+'"totalFarms2016"'+")))) As properties FROM db_postgis_test As db, ecumene As agg, censusdistricts As lg WHERE db.id = lg.ccsuid AND db."+'"totalFarms2016"'+" > 0 AND ST_Intersects(agg.geom, lg.geom) AND agg.geom && ST_MakeEnvelope("+req.body.minLon+", "+req.body.minLat+", "+req.body.maxLon+", "+req.body.maxLat+", 4326) GROUP BY agg.cdname, agg.geom) As f )  As fc;"
  	if (parseInt(req.body.zoom) > 10){
  		question = q
  	} else if (parseInt(req.body.zoom) < 5){
  		question = q2
  		} else {
  			question = q3
  		}
  	var question = parseInt(req.body.zoom) < 10 ? q2 : q
  	var question = parseInt(req.body.zoom) < 5 ? q2 : q
  	console.log(question)
	var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(question));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        var result = result.rows[0].row_to_json;
        res.render('index', { 
    		value1: 'A', value2: 4, value3: 'C', value4: 'D', bounds: bounds, clat: req.body.clat, clng:req.body.clng, data: result, zoom:req.body.zoom
		} );
    });
    
});

app.get('/data', function (req, res) {
    var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(q));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows[0].row_to_json);
        res.end();
    });
});

app.post('/asdf', function( req, resr, next ) {
  bounds=req.body.bounds
  clat = req.body.clat
  clng = req.body.clng
  var z=parseInt(req.body.value2)
  var minLon = bounds[0]
  var minLat = bounds[1]
  var maxLon = bounds[2]
  var maxLat = bounds[3]
  console.log(resr, bounds, req.body.center, clat, clng, minLon)
 
 	//AND ST_Transform(ST_MakeEnvelope("+minLon+", "+minLat+", "+maxLon+", "+maxLat+", 4326), 4326);
 	var client = new Client(conString);
 	var result ="res"
	app.get('/', function (req, res) {
	    var client = new Client(conString);
	    client.connect();
	    var query = client.query(new Query(initquery));
	    query.on("row", function (row, result) {
	        result.addRow(row);
	    });
	    query.on("end", function (result) {
	        res.send(result.rows[0].row_to_json);
	        res.end();
	    });
	    console.log(result)
	});
  resr.render('index', { 
			  	value1: 'A', value2: z, value3: z, value4: req.body.value4, bounds: bounds, clat:clat, clng:clng, data:result
			  } );
  



});

app.listen(8080);
console.log('8080 is the magic port');