var bleno = require('bleno');
var Pusher = require('pusher');

var dateFormat = require('dateformat');

require('dotenv').config();

var pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.APP_KEY,
  secret: process.env.APP_SECRET,
  cluster: process.env.APP_CLUSTER,
  encrypted: true
});

var time_format = 'h:MM TT';

var attendees = [
  {id: 1, full_name: 'milfa', time_entered: dateFormat(new Date(1505901033110), time_format)},
  {id: 2, full_name: 'red', time_entered: dateFormat(new Date(1505901733110), time_format)},
  {id: 3, full_name: 'silver', time_entered: dateFormat(new Date(1505908733110), time_format)}
];

var settings = {
  service_id: '12ab',
  characteristic_id: '34cd'
};

bleno.on('stateChange', function(state){
  if(state === 'poweredOn'){
    bleno.startAdvertising('AttendanceApp', [settings.service_id]);
  }else{
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error){
    if(error){
      console.log('something went wrong while trying to start advertisement of services');
    }else{
      console.log('started..');
      bleno.setServices([
        new bleno.PrimaryService({
          uuid : settings.service_id,
          characteristics : [
            new bleno.Characteristic({
              value : null,
              uuid : settings.characteristic_id,
              properties : ['write'],
              onWriteRequest : function(data, offset, withoutResponse, callback){
               
                var attendee = JSON.parse(data.toString());
                attendee.time_entered = dateFormat(new Date(), time_format);
                attendees.push(attendee);
                console.log(attendees);

                pusher.trigger('attendance-channel', 'attendance-event', attendee);

                callback(this.RESULT_SUCCESS);
              }
            })
          ]
        })
      ]);
    }
});


bleno.on('accept', function(clientAddress){
  console.log('client address: ', clientAddress);
  var data = {
    is_attendees: true,
    attendees: attendees
  };
  pusher.trigger('attendance-channel', 'attendance-event', data);
});
