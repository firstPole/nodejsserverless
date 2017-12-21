'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
const Geo = require('geo-nearby');
const geohash = require('ngeohash');
AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();
var locationdata = {};

module.exports.list = (event, context, callback) => {
    var params = {
        TableName: process.env.PROPERTY_TABLE,
        ProjectionExpression: "id, property_name, property_type,istoilet,address1,address2,city,country,property_state,postalcode,latitude,longitude"
    };
    console.log("Scanning Property table.");
        const onScan = (err, data) => {

            if (err) {
                console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
                callback(err);
            } else {
                locationdata = JSON.stringify({property:data.Items});
                console.log("Scan succeeded.");
                return callback(null, {
                    statusCode: 200,
                    body: JSON.stringify({
                        property: data.Items
                    })

                });
            }

        };

        dynamoDb.scan(params, onScan);

    };


    module.exports.getlist = () => {
        var params = {
            TableName: process.env.PROPERTY_TABLE,
            ProjectionExpression: "id, property_name, property_type,istoilet,address1,address2,city,country,property_state,postalcode,latitude,longitude"
        };
        console.log("Scanning Property table.");
            const onScan = (err, data) => {

                if (err) {
                    console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
                    callback(err);
                } else {
                    locationdata = JSON.stringify({property:data.Items});
                    console.log("Scan succeeded."+locationdata);
                }

            };

            dynamoDb.scan(params, onScan);

        };


module.exports.getnearbyLocation = (event, context, callback) =>{

    this.getlist();
  //  console.log("location before:", locationdata.property);
    setTimeout(()=>{
    //  console.log("location after:", locationdata);
      var ldata = JSON.parse(locationdata);
/*
      const ldata = [
  { lat: -35.30278, lon: 149.14167, name: 'Canberra' },
  { lat: -33.86944, lon: 151.20833, name: 'Sydney' },
  { lat: -37.82056, lon: 144.96139, name: 'Melbourne' },
  { lat: -34.93333, lon: 138.58333, name: 'Adelaide' },
  { lat: -27.46778, lon: 153.02778, name: 'Brisbane' },
  { lat: -31.95306, lon: 115.85889, name: 'Perth' }
];*/
/*
      const dataSet = Geo.createCompactSet(ldata.property, { id: 'property_name',lat:'latitude',lon:'longitude' });
      const geo = new Geo(dataSet, { sorted: true });
    //  const geo = new Geo(ldata.property,{ setOptions: { id: 'property_name', latitude: 'latitude', longitude: 'longitude' } })
      geo.nearBy(23.5856845, 72.3740831, 1000);
      return callback(null,{
        statusCode: 200,
        body : JSON.stringify(dataSet)
   }); */


   var result = [];

    for (var p in ldata.property) {
        ldata.property[p]["geoHash"] = geohash.encode_int (ldata.property[p].latitude, ldata.property[p].longitude,52);
        result.push(ldata.property[p]);
    }

    const geo = new Geo(result, { hash: 'geoHash' });
    var nearbylocationdata = geo.nearBy(23.0170007, 72.5928823, 1000);

    return callback(null,{
      statusCode: 200,
      body : JSON.stringify(nearbylocationdata)
    });


    },2000);
};


module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const property_name = requestBody.property_name;
  const property_type = requestBody.property_type;
  const istoilet = requestBody.istoilet;
  const address1 = requestBody.address1;
  const address2 = requestBody.address2;
  const city = requestBody.city;
  const property_state = requestBody.property_state;
  const country = requestBody.country;
  const postalcode = requestBody.postalcode;
  const latitude = requestBody.latitude;
  const longitude = requestBody.longitude;
  const submitttedBy = requestBody.submitttedBy;
  const submittedByNumber = requestBody.submittedByNumber;
/*
  if (typeof fullname !== 'string' || typeof email !== 'string' || typeof experience !== 'number') {
    console.error('Validation Failed');
    callback(new Error('Couldn\'t submit candidate because of validation errors.'));
    return;
  }
*/
  submitPropertyP(propertyInfo(property_name, property_type, istoilet,address1,address2,city,property_state,country,postalcode,latitude,longitude,submitttedBy,submittedByNumber))
    .then(res => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Sucessfully submitted Property Details with Property : ${property_name}`,
          propertyId: res.id
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to submit Property with Property ${property_name}`
        })
      })
    });
};


const submitPropertyP = property => {
  console.log('Submitting Property');
  const propertyInfo = {
    TableName: process.env.PROPERTY_TABLE,
    Item: property,
  };
  return dynamoDb.put(propertyInfo).promise()
    .then(res => property);
};


const propertyInfo = (property_name, property_type, istoilet,address1,address2,city,property_state,country,postalcode,latitude,longitude,submitttedBy,submittedByNumber) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    property_name: property_name,
    property_type: property_type,
    istoilet: istoilet,
    address1: address1,
    address2: address2,
    city: city,
    property_state: property_state,
    country: country,
    postalcode: postalcode,
    latitude: latitude,
    longitude: longitude,
    submitttedBy: submitttedBy,
    submittedByNumber: submittedByNumber,
    submittedAt: timestamp,
  };
};
