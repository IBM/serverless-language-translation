// should be paired as a sequence with "translateText" action and called after each language translation.
var request = require('request')
function sendSMS() {
  twilioClient.messages.create({
      to: i.key.split('+')[1],
      from: params.twilo_number,
      body: message.toString(),
  }, function(err, message) {
      if (err) {
        console.log('error:', err);
      }
      else {
        console.log(message.sid);
      }
  })
}

function queryEtcd(targetLanguage, message) {
  request('http://' + params.etcdIP + ':2379/v2/keys/languages/' + targetLanguage,
    function (error, response, body) {
      console.log("checking for " + targetLanguage + "numbers registered in etcd")
      console.log("SENDER: " + client)
      if (JSON.parse(body).node && JSON.parse(body).node.nodes) {
        for (i of JSON.parse(body).node.nodes) {
          console.log( "TARGET: " + i.key.split('+')[1] )
          if ( client.split('+')[1] != i.key.split('+')[1] ) {
          // console.log(i.key.split('+')[1])
            sendSMS(message)
          }
        }
      }
      else {
          console.log("no numbers found")
        }
      }
  )
}


function main(params) {
  var languages = ['ar', 'es', 'fr', 'en', 'it', 'de', 'pt']
  for (language in languages) {
    queryEtcd(lanuage, params.message)
  }
}
